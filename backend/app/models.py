from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from .database import Base

class ProcessingSession(Base):
    __tablename__ = "processing_sessions"

    id = Column(String(64), primary_key=True)
    session_name = Column(String(128), nullable=False)
    status = Column(String(32), default="CREATED")
    mode = Column(String(32), default="DISTRIBUTED")
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)

class TaskModel(Base):
    __tablename__ = "tasks"

    task_id = Column(String(64), primary_key=True)
    session_id = Column(String(64), ForeignKey("processing_sessions.id", ondelete="CASCADE"), nullable=True)
    sequence_no = Column(Integer, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    worker_id = Column(String(64), nullable=True)
    status = Column(String(32), default="PENDING")
    processing_time_ms = Column(Float, default=0.0)

class PredictionModel(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String(64), nullable=True)
    session_id = Column(String(64), nullable=True)
    sequence_no = Column(Integer, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    worker_id = Column(String(64), nullable=True)
    prediction = Column(String(32), nullable=False)
    confidence = Column(Float, nullable=False)
    probabilities_json = Column(JSON, nullable=False)

class WorkerMetricModel(Base):
    __tablename__ = "worker_metrics"

    worker_id = Column(String(64), primary_key=True)
    heartbeat_timestamp = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    status = Column(String(32), default="OFFLINE")
    total_tasks_processed = Column(Integer, default=0)
    avg_latency_ms = Column(Float, default=0.0)
    cpu_percent = Column(Float, default=0.0)
    memory_mb = Column(Float, default=0.0)
