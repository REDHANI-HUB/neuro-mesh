CREATE TABLE IF NOT EXISTS processing_sessions (
    id VARCHAR(64) PRIMARY KEY,
    session_name VARCHAR(128) NOT NULL,
    status VARCHAR(32) DEFAULT 'CREATED',
    mode VARCHAR(32) DEFAULT 'DISTRIBUTED',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS tasks (
    task_id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES processing_sessions(id) ON DELETE CASCADE,
    sequence_no INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    worker_id VARCHAR(64),
    status VARCHAR(32) DEFAULT 'PENDING',
    processing_time_ms FLOAT DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(64) REFERENCES tasks(task_id) ON DELETE CASCADE,
    session_id VARCHAR(64) REFERENCES processing_sessions(id) ON DELETE CASCADE,
    sequence_no INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    worker_id VARCHAR(64),
    prediction VARCHAR(32) NOT NULL,
    confidence FLOAT NOT NULL,
    probabilities_json JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS worker_metrics (
    worker_id VARCHAR(64) PRIMARY KEY,
    heartbeat_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'OFFLINE',
    total_tasks_processed INTEGER DEFAULT 0,
    avg_latency_ms FLOAT DEFAULT 0.0,
    cpu_percent FLOAT DEFAULT 0.0,
    memory_mb FLOAT DEFAULT 0.0
);
