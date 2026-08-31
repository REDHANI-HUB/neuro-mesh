import os
import time
import json
import redis
from eeg_generator import EEGStreamSimulator

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
STREAM_INTERVAL_MS = int(os.getenv("STREAM_INTERVAL_MS", 500))

def main():
    print(f"Connecting to Redis at {REDIS_HOST}:{REDIS_PORT}...")
    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True, socket_timeout=1.0)
    sim = EEGStreamSimulator(n_channels=64, sampling_rate=500, window_sec=2.0)
    print("EEG Stream Simulator Initialized.")
    
    while True:
        try:
            is_active = False
            session_id = "default_session"
            try:
                is_active = r.get("neuromesh_stream_active") == "true"
                session_id = r.get("neuromesh_session_id") or "default_session"
            except Exception:
                pass
            
            if is_active:
                chunk = sim.generate_chunk()
                task_id = f"task_{session_id}_{chunk['sequence_no']}"
                
                payload = {
                    "task_id": task_id,
                    "session_id": session_id,
                    "sequence_no": chunk["sequence_no"],
                    "timestamp": chunk["timestamp"],
                    "n_channels": chunk["n_channels"],
                    "n_samples": chunk["n_samples"],
                    "data_source": chunk["data_source"],
                    "eeg_data": chunk["eeg_data"]
                }
                
                try:
                    r.rpush("eeg_task_queue", json.dumps(payload))
                    print(f"[SIMULATOR] Emitted task: {task_id} (Seq: {chunk['sequence_no']}) -> eeg_task_queue")
                except Exception as e:
                    print(f"[SIMULATOR REDIS QUEUE ERROR] {e}")
                
            time.sleep(STREAM_INTERVAL_MS / 1000.0)
        except Exception as e:
            print(f"[SIMULATOR ERROR] {e}")
            time.sleep(2.0)

if __name__ == "__main__":
    main()
