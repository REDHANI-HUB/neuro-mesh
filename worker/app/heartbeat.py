import time
import psutil
import psycopg2
import os

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_USER = os.getenv("POSTGRES_USER", "neuromesh")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "neuromesh_secret")
POSTGRES_DB = os.getenv("POSTGRES_DB", "neuromesh_db")

def update_worker_heartbeat(worker_id, total_processed, avg_latency_ms):
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
        cpu = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory().used / (1024 * 1024)
        
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
    except Exception as e:
        pass
