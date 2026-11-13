import time
import psutil
import psycopg2
import sqlite3
import os

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_USER = os.getenv("POSTGRES_USER", "neuromesh")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "neuromesh_secret")
POSTGRES_DB = os.getenv("POSTGRES_DB", "neuromesh_db")

def update_worker_heartbeat(worker_id, total_processed, avg_latency_ms):
    cpu = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory().used / (1024 * 1024)
    
    # 1. Try PostgreSQL Database
    try:
        conn = psycopg2.connect(
            dbname=POSTGRES_DB,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            connect_timeout=1
        )
        cur = conn.cursor()
        query = """
            INSERT INTO worker_metrics (worker_id, heartbeat_timestamp, status, total_tasks_processed, avg_latency_ms, cpu_percent, memory_mb)
            VALUES (%s, NOW(), 'ONLINE', %s, %s, %s, %s)
            ON CONFLICT (worker_id) 
            DO UPDATE SET 
                heartbeat_timestamp = NOW(),
                status = 'ONLINE',
                total_tasks_processed = EXCLUDED.total_tasks_processed,
                avg_latency_ms = EXCLUDED.avg_latency_ms,
                cpu_percent = EXCLUDED.cpu_percent,
                memory_mb = EXCLUDED.memory_mb;
        """
        cur.execute(query, (worker_id, total_processed, avg_latency_ms, cpu, mem))
        conn.commit()
        cur.close()
        conn.close()
        return
    except Exception:
        pass

    # 2. SQLite Database Fallback (For Host Windows execution without PostgreSQL container)
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        sqlite_path = os.path.join(base_dir, "neuromesh_db.db")
        if not os.path.exists(sqlite_path):
            sqlite_path = os.path.join(base_dir, "backend", "neuromesh_db.db")

        conn = sqlite3.connect(sqlite_path, timeout=2.0)
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS worker_metrics (
                worker_id TEXT PRIMARY KEY,
                heartbeat_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'OFFLINE',
                total_tasks_processed INTEGER DEFAULT 0,
                avg_latency_ms REAL DEFAULT 0.0,
                cpu_percent REAL DEFAULT 0.0,
                memory_mb REAL DEFAULT 0.0
            );
        """)
        cur.execute("""
            INSERT INTO worker_metrics (worker_id, heartbeat_timestamp, status, total_tasks_processed, avg_latency_ms, cpu_percent, memory_mb)
            VALUES (?, CURRENT_TIMESTAMP, 'ONLINE', ?, ?, ?, ?)
            ON CONFLICT(worker_id) DO UPDATE SET
                heartbeat_timestamp = CURRENT_TIMESTAMP,
                status = 'ONLINE',
                total_tasks_processed = excluded.total_tasks_processed,
                avg_latency_ms = excluded.avg_latency_ms,
                cpu_percent = excluded.cpu_percent,
                memory_mb = excluded.memory_mb;
        """, (worker_id, total_processed, avg_latency_ms, cpu, mem))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        pass
