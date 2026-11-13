import os
import time
import json
import requests
import psycopg2
from smart_redis import SmartRedisClient

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

import sqlite3

def save_to_database(conn, res):
    if conn:
        try:
            cur = conn.cursor()
            task_sql = """
                INSERT INTO tasks (task_id, session_id, sequence_no, timestamp, worker_id, status, processing_time_ms)
                VALUES (%s, %s, %s, NOW(), %s, %s, %s)
                ON CONFLICT (task_id) DO UPDATE SET 
                    worker_id = EXCLUDED.worker_id,
                    status = EXCLUDED.status,
                    processing_time_ms = EXCLUDED.processing_time_ms;
            """
            cur.execute(task_sql, (
                res["task_id"],
                res["session_id"],
                res["sequence_no"],
                res["worker_id"],
                res.get("status", "COMPLETED"),
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
            return
        except Exception as e:
            print(f"[POSTGRES SAVE ERROR] {e}", flush=True)
            if conn:
                conn.rollback()

    # Fallback SQLite DB when PostgreSQL is not running natively
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        sqlite_path = os.path.join(base_dir, "neuromesh_db.db")
        if not os.path.exists(sqlite_path):
            sqlite_path = os.path.join(base_dir, "backend", "neuromesh_db.db")

        sconn = sqlite3.connect(sqlite_path, timeout=5.0)
        scur = sconn.cursor()
        scur.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT UNIQUE,
                session_id TEXT,
                sequence_no INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                worker_id TEXT,
                status TEXT,
                processing_time_ms REAL
            );
        """)
        scur.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT,
                session_id TEXT,
                sequence_no INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                worker_id TEXT,
                prediction TEXT,
                confidence REAL,
                probabilities_json JSON
            );
        """)
        scur.execute("""
            INSERT INTO tasks (task_id, session_id, sequence_no, worker_id, status, processing_time_ms)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(task_id) DO UPDATE SET
                worker_id = excluded.worker_id,
                status = excluded.status,
                processing_time_ms = excluded.processing_time_ms;
        """, (
            res["task_id"],
            res["session_id"],
            res["sequence_no"],
            res["worker_id"],
            res.get("status", "COMPLETED"),
            res["processing_time_ms"]
        ))
        scur.execute("""
            INSERT INTO predictions (task_id, session_id, sequence_no, worker_id, prediction, confidence, probabilities_json)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        """, (
            res["task_id"],
            res["session_id"],
            res["sequence_no"],
            res["worker_id"],
            res["prediction"],
            res["confidence"],
            json.dumps(res["probabilities"])
        ))
        sconn.commit()
        scur.close()
        sconn.close()
    except Exception as e:
        print(f"[SQLITE FALLBACK ERROR] {e}", flush=True)


def main():
    print(f"[AGGREGATOR] Starting Result Aggregator service...")
    r = SmartRedisClient(host=REDIS_HOST, port=REDIS_PORT)
    
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
                pop_res = r.blpop("eeg_result_queue", timeout=1)
            except Exception:
                time.sleep(0.5)
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
                    "processing_time_ms": res["processing_time_ms"],
                    "waveform_preview": res.get("waveform_preview", []),
                    "sensor_powers": res.get("sensor_powers", {}),
                    "ground_truth_label": res.get("ground_truth_label"),
                    "data_source": res.get("data_source")
                }, timeout=1.0)
            except Exception:
                pass
                
            print(f"[AGGREGATOR] Aggregated task: {res['task_id']} | Seq: {res['sequence_no']} | Worker: {res['worker_id']} | Action: {res['prediction']} ({res['confidence']*100:.1f}%)")
            
        except Exception as e:
            print(f"[AGGREGATOR ERROR] {e}")
            time.sleep(1.0)

if __name__ == "__main__":
    main()
