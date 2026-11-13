import os
import time
import json
from eeg_pipeline import preprocess_and_extract
from ml_inference import BCIInferenceEngine
from heartbeat import update_worker_heartbeat
from smart_redis import SmartRedisClient

WORKER_ID = os.getenv("WORKER_ID", "worker-1")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
MAX_RETRIES = 3

def main():
    print(f"[{WORKER_ID.upper()}] Service initializing...")
    print(f"[{WORKER_ID.upper()}] Connecting to Redis message broker at {REDIS_HOST}:{REDIS_PORT}...")
    
    r = SmartRedisClient(host=REDIS_HOST, port=REDIS_PORT)
    engine = BCIInferenceEngine()
    
    total_processed = 0
    total_latency_ms = 0.0
    last_heartbeat = 0
    
    print(f"[{WORKER_ID.upper()}] Worker Node active and listening on `eeg_task_queue`...")
    
    while True:
        try:
            now = time.time()
            if now - last_heartbeat > 1.5:
                avg_lat = (total_latency_ms / total_processed) if total_processed > 0 else 22.0
                update_worker_heartbeat(WORKER_ID, total_processed, avg_lat)
                last_heartbeat = now
                
            pop_res = None
            try:
                pop_res = r.blpop("eeg_task_queue", timeout=1)
            except Exception:
                time.sleep(0.5)
                continue
                
            if not pop_res:
                continue
                
            _, raw_payload = pop_res
            task = json.loads(raw_payload)
            retry_count = task.get("retry_count", 0)
            
            t_start = time.time()
            try:
                if task.get("status") == "DATASET_UNAVAILABLE":
                    result_payload = {
                        "task_id": task["task_id"],
                        "session_id": task["session_id"],
                        "sequence_no": task["sequence_no"],
                        "timestamp": task["timestamp"],
                        "worker_id": WORKER_ID,
                        "prediction": "DATASET UNAVAILABLE",
                        "confidence": 0.0,
                        "probabilities": {},
                        "processing_time_ms": 0.0,
                        "status": "FAILED",
                        "error": task.get("message")
                    }
                    r.rpush("eeg_result_queue", json.dumps(result_payload))
                    continue

                features = preprocess_and_extract(task["eeg_data"], fs=task.get("sampling_rate", 500))
                pred_class, conf, probas = engine.predict(features)
                t_end = time.time()
                proc_time_ms = round((t_end - t_start) * 1000.0, 2)
                
                total_processed += 1
                total_latency_ms += proc_time_ms
                
                result_payload = {
                    "task_id": task["task_id"],
                    "session_id": task["session_id"],
                    "sequence_no": task["sequence_no"],
                    "timestamp": task["timestamp"],
                    "worker_id": WORKER_ID,
                    "prediction": pred_class,
                    "confidence": conf,
                    "probabilities": probas,
                    "processing_time_ms": proc_time_ms,
                    "waveform_preview": task.get("waveform_preview", []),
                    "sensor_powers": task.get("sensor_powers", {}),
                    "ground_truth_label": task.get("ground_truth_label"),
                    "data_source": task.get("data_source"),
                    "model_version": engine.metadata.get("model_version", "v1.0.0"),
                    "status": "COMPLETED"
                }
                
                r.rpush("eeg_result_queue", json.dumps(result_payload))
                print(f"[{WORKER_ID.upper()}] Task: {task['task_id']} | Worker: {WORKER_ID} | Action: {pred_class} ({conf*100:.1f}%) | Time: {proc_time_ms} ms")
                
            except Exception as task_err:
                print(f"[{WORKER_ID.upper()} TASK ERROR] Task {task.get('task_id')} failed: {task_err}")
                if retry_count < MAX_RETRIES:
                    task["retry_count"] = retry_count + 1
                    task["status"] = "RETRYING"
                    r.rpush("eeg_task_queue", json.dumps(task))
                    print(f"[{WORKER_ID.upper()}] Re-queued task {task.get('task_id')} (Retry {retry_count + 1}/{MAX_RETRIES})")
                else:
                    task["status"] = "DEAD_LETTER"
                    task["failed_by_worker"] = WORKER_ID
                    task["error"] = str(task_err)
                    r.rpush("eeg_dead_letter_queue", json.dumps(task))
                    print(f"[{WORKER_ID.upper()}] Max retries reached. Sent task {task.get('task_id')} to `eeg_dead_letter_queue`.")
            
        except Exception as e:
            print(f"[{WORKER_ID.upper()} LOOP ERROR] {e}")
            time.sleep(1.0)

if __name__ == "__main__":
    main()
