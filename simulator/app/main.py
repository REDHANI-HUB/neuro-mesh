import os
import time
import json
from eeg_generator import EEGStreamSimulator
from smart_redis import SmartRedisClient

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
STREAM_INTERVAL_MS = int(os.getenv("STREAM_INTERVAL_MS", 500))

def main():
    print(f"[SIMULATOR] Connecting to Redis task broker at {REDIS_HOST}:{REDIS_PORT}...")
    r = SmartRedisClient(host=REDIS_HOST, port=REDIS_PORT)
    sim = EEGStreamSimulator(n_channels=64, sampling_rate=500, window_sec=2.0)
    print("[SIMULATOR] EEG Stream Simulator initialized and awaiting active session...")
    
    while True:
        try:
            is_active = False
            session_id = "default_session"
            dataset_mode = "DEMO"
            
            try:
                is_active = r.get("neuromesh_stream_active") == "true"
                session_id = r.get("neuromesh_session_id") or "default_session"
                dataset_mode = r.get("neuromesh_dataset_mode") or "DEMO"
            except Exception:
                pass
            
            if is_active:
                chunk = sim.generate_chunk(mode=dataset_mode)
                task_id = f"task_{session_id}_{chunk['sequence_no']}"
                
                payload = {
                    "task_id": task_id,
                    "session_id": session_id,
                    "sequence_no": chunk["sequence_no"],
                    "timestamp": chunk["timestamp"],
                    "n_channels": chunk["n_channels"],
                    "n_samples": chunk["n_samples"],
                    "data_source": chunk["data_source"],
                    "eeg_data": chunk.get("eeg_data"),
                    "waveform_preview": chunk.get("waveform_preview"),
                    "sensor_powers": chunk.get("sensor_powers"),
                    "ground_truth_label": chunk.get("ground_truth_label"),
                    "status": chunk.get("status", "OK")
                }
                
                try:
                    r.rpush("eeg_task_queue", json.dumps(payload))
                    print(f"[SIMULATOR] Emitted task: {task_id} | Mode: {dataset_mode} | Source: {chunk['data_source']} | Shape: {chunk['n_channels']}x{chunk['n_samples']}")
                except Exception as e:
                    print(f"[SIMULATOR REDIS QUEUE ERROR] {e}")
                
            time.sleep(STREAM_INTERVAL_MS / 1000.0)
        except Exception as e:
            print(f"[SIMULATOR ERROR] {e}")
            time.sleep(2.0)

if __name__ == "__main__":
    main()
