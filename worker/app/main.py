import os
import time
import json
import redis
from eeg_pipeline import preprocess_and_extract
from ml_inference import BCIInferenceEngine
from heartbeat import update_worker_heartbeat

WORKER_ID = os.getenv("WORKER_ID", "worker-1")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

def main():
    print(f"[{WORKER_ID}] Starting Worker Node service...")
    print(f"[{WORKER_ID}] Connecting to Redis broker at {REDIS_HOST}:{REDIS_PORT}...")
    
    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True, socket_timeout=1.0)
    engine = BCIInferenceEngine()
    
    total_processed = 0
    total_latency_ms = 0.0
    last_heartbeat = 0
    
    print(f"[{WORKER_ID}] Worker Node initialized and listening on `eeg_task_queue`...")
    
    while True:
        try:
            now = time.time()
            if now - last_heartbeat > 3.0:
                avg_lat = (total_latency_ms / total_processed) if total_processed > 0 else 0.0
                update_worker_heartbeat(WORKER_ID, total_processed, avg_lat)
                last_heartbeat = now
                
            pop_res = None
            try:
                pop_res = r.blpop("eeg_task_queue", timeout=2)
            except Exception:
                time.sleep(1.0)
                continue
                
            if not pop_res:
                continue
                
            _, raw_payload = pop_res
            task = json.loads(raw_payload)
            
            t_start = time.time()
            features = preprocess_and_extract(task["eeg_data"])
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
                "processing_time_ms": proc_time_ms
            }
            
            r.rpush("eeg_result_queue", json.dumps(result_payload))
            print(f"[{WORKER_ID.upper()}] Processed task: {task['task_id']} | Seq: {task['sequence_no']} | Pred: {pred_class} ({conf*100:.1f}%) | Time: {proc_time_ms} ms")
            
        except Exception as e:
            print(f"[{WORKER_ID} ERROR] {e}")
            time.sleep(1.0)

if __name__ == "__main__":
    main()
