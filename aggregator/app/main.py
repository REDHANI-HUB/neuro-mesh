import os
import time
import json
import redis
import requests
import psycopg2

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_USER = os.getenv("POSTGRES_USER", "neuromesh")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "neuromesh_secret")
POSTGRES_DB = os.getenv("POSTGRES_DB", "neuromesh_db")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

def get_db_connection():
    return psycopg2.connect(
        dbname=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        connect_timeout=1
    )

def save_to_database(conn, res):
    if not conn:
        return
    try:
        cur = conn.cursor()
        task_sql = """
            INSERT INTO tasks (task_id, session_id, sequence_no, timestamp, worker_id, status, processing_time_ms)
            VALUES (%s, %s, %s, NOW(), %s, 'COMPLETED', %s)
            ON CONFLICT (task_id) DO UPDATE SET 
                worker_id = EXCLUDED.worker_id,
                status = 'COMPLETED',
                processing_time_ms = EXCLUDED.processing_time_ms;
        """
        cur.execute(task_sql, (
            res["task_id"],
            res["session_id"],
            res["sequence_no"],
            res["worker_id"],
            res["processing_time_ms"]
        ))
        
        pred_sql = """
            INSERT INTO predictions (task_id, session_id, sequence_no, timestamp, worker_id, prediction, confidence, probabilities_json)
            VALUES (%s, %s, %s, NOW(), %s, %s, %s, %s);
        """
        cur.execute(pred_sql, (
            res["task_id"],
            res["session_id"],
            res["sequence_no"],
            res["worker_id"],
            res["prediction"],
            res["confidence"],
            json.dumps(res["probabilities"])
        ))
        conn.commit()
        cur.close()
    except Exception as e:
        if conn:
            conn.rollback()

def main():
    print(f"[AGGREGATOR] Starting Result Aggregator service...")
    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True, socket_timeout=1.0)
    
    conn = None
    try:
        conn = get_db_connection()
        print("[AGGREGATOR] Connected to PostgreSQL Database.")
    except Exception:
        print("[AGGREGATOR] PostgreSQL database not available (running in memory relay mode).")
            
    print("[AGGREGATOR] Listening on `eeg_result_queue`...")
    
    while True:
        try:
            pop_res = None
            try:
                pop_res = r.blpop("eeg_result_queue", timeout=2)
            except Exception:
                time.sleep(1.0)
                continue
                
            if not pop_res:
                continue
                
            _, raw_data = pop_res
            res = json.loads(raw_data)
            
            save_to_database(conn, res)
            
            try:
                requests.post(f"{BACKEND_URL}/api/push_event", json={
                    "task_id": res["task_id"],
                    "session_id": res["session_id"],
                    "sequence_no": res["sequence_no"],
                    "worker_id": res["worker_id"],
                    "prediction": res["prediction"],
                    "confidence": res["confidence"],
                    "probabilities": res["probabilities"],
                    "processing_time_ms": res["processing_time_ms"]
                }, timeout=1.0)
            except Exception:
                pass
                
            print(f"[AGGREGATOR] Aggregated task: {res['task_id']} | Seq: {res['sequence_no']} | Worker: {res['worker_id']} | Action: {res['prediction']}")
            
        except Exception as e:
            print(f"[AGGREGATOR ERROR] {e}")
            time.sleep(1.0)

if __name__ == "__main__":
    main()
