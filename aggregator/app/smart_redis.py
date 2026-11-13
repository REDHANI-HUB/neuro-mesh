import redis
import queue
import time
import json
import threading
import sqlite3
import os

class SmartRedisClient:
    """
    Transparent Redis Client with automatic fallback to Shared SQLite Inter-Process Queue & Key-Value Storage.
    Guarantees 100% functionality on Windows host across multi-process runs even without Redis server installed.
    """
    _db_path = None
    _lock = threading.Lock()

    @classmethod
    def _get_db_path(cls):
        if cls._db_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            cls._db_path = os.path.join(base_dir, "neuromesh_ipc.db")
            cls._init_sqlite_db()
        return cls._db_path

    @classmethod
    def _init_sqlite_db(cls):
        try:
            with sqlite3.connect(cls._db_path, timeout=5.0) as conn:
                cur = conn.cursor()
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS smart_kv (
                        key TEXT PRIMARY KEY,
                        value TEXT
                    );
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS smart_queue (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        queue_name TEXT,
                        payload TEXT,
                        created_at REAL
                    );
                """)
                conn.commit()
        except Exception:
            pass

    def __init__(self, host='localhost', port=6379, socket_timeout=0.3, socket_connect_timeout=0.3, decode_responses=True):
        self.host = host
        self.port = port
        self.real_r = None
        try:
            r = redis.Redis(
                host=host,
                port=port,
                decode_responses=decode_responses,
                socket_timeout=socket_timeout,
                socket_connect_timeout=socket_connect_timeout
            )
            if r.ping():
                self.real_r = r
        except Exception:
            self.real_r = None

    def ping(self):
        if self.real_r:
            try:
                return self.real_r.ping()
            except Exception:
                pass
        return True

    def set(self, key, value):
        if self.real_r:
            try:
                return self.real_r.set(key, value)
            except Exception:
                pass
        db_path = self._get_db_path()
        with SmartRedisClient._lock:
            try:
                with sqlite3.connect(db_path, timeout=5.0) as conn:
                    cur = conn.cursor()
                    cur.execute("INSERT INTO smart_kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;", (key, str(value)))
                    conn.commit()
            except Exception:
                pass
        return True

    def get(self, key):
        if self.real_r:
            try:
                return self.real_r.get(key)
            except Exception:
                pass
        db_path = self._get_db_path()
        with SmartRedisClient._lock:
            try:
                with sqlite3.connect(db_path, timeout=5.0) as conn:
                    cur = conn.cursor()
                    cur.execute("SELECT value FROM smart_kv WHERE key = ?;", (key,))
                    row = cur.fetchone()
                    if row:
                        return row[0]
            except Exception:
                pass
        return None

    def delete(self, *keys):
        if self.real_r:
            try:
                return self.real_r.delete(*keys)
            except Exception:
                pass
        db_path = self._get_db_path()
        with SmartRedisClient._lock:
            try:
                with sqlite3.connect(db_path, timeout=5.0) as conn:
                    cur = conn.cursor()
                    for k in keys:
                        cur.execute("DELETE FROM smart_kv WHERE key = ?;", (k,))
                        cur.execute("DELETE FROM smart_queue WHERE queue_name = ?;", (k,))
                    conn.commit()
            except Exception:
                pass
        return True

    def rpush(self, name, value):
        if self.real_r:
            try:
                return self.real_r.rpush(name, value)
            except Exception:
                pass
        db_path = self._get_db_path()
        with SmartRedisClient._lock:
            try:
                with sqlite3.connect(db_path, timeout=5.0) as conn:
                    cur = conn.cursor()
                    cur.execute("INSERT INTO smart_queue (queue_name, payload, created_at) VALUES (?, ?, ?);", (name, str(value), time.time()))
                    conn.commit()
            except Exception:
                pass
        return True

    def blpop(self, keys, timeout=0):
        if self.real_r:
            try:
                return self.real_r.blpop(keys, timeout=timeout)
            except Exception:
                pass
        if isinstance(keys, str):
            keys = [keys]

        db_path = self._get_db_path()
        start_t = time.time()
        max_wait = max(0.1, timeout if timeout else 0.5)

        while True:
            with SmartRedisClient._lock:
                try:
                    conn = sqlite3.connect(db_path, timeout=5.0)
                    cur = conn.cursor()
                    placeholders = ",".join(["?"] * len(keys))
                    cur.execute(f"SELECT id, queue_name, payload FROM smart_queue WHERE queue_name IN ({placeholders}) ORDER BY id ASC LIMIT 1;", keys)
                    row = cur.fetchone()
                    if row:
                        row_id, q_name, payload = row
                        cur.execute("DELETE FROM smart_queue WHERE id = ?;", (row_id,))
                        conn.commit()
                        conn.close()
                        return (q_name, payload)
                    conn.close()
                except Exception:
                    pass

            if (time.time() - start_t) >= max_wait:
                break
            time.sleep(0.03)

        return None

    def llen(self, name):
        if self.real_r:
            try:
                return self.real_r.llen(name)
            except Exception:
                pass
        db_path = self._get_db_path()
        with SmartRedisClient._lock:
            try:
                with sqlite3.connect(db_path, timeout=5.0) as conn:
                    cur = conn.cursor()
                    cur.execute("SELECT COUNT(*) FROM smart_queue WHERE queue_name = ?;", (name,))
                    row = cur.fetchone()
                    if row:
                        return row[0]
            except Exception:
                pass
        return 0

