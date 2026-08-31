# NeuroMesh — Distributed Real-Time BCI Processing and Motor-Imagery Command System

[![Architecture](https://img.shields.io/badge/Architecture-Distributed%20Microservices-cyan.svg)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg)](https://github.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.0-61dafb.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed.svg)](https://www.docker.com/)

**NeuroMesh** is an academic software-only distributed computing system designed to solve high-volume, real-time Brain-Computer Interface (BCI) electroencephalogram (EEG) signal processing bottlenecks. By distributing continuous EEG epoch filtering, feature extraction, and machine learning inference across multiple concurrent worker nodes via a Redis message broker, NeuroMesh achieves ultra-low latency and scalable throughput.

---

## 1. System Architecture

```
                               ┌─────────────────────────┐
                               │   EEG DATASET SOURCE    │
                               │  (Synthetic / PhysioNet)│
                               └────────────┬────────────┘
                                            │
                                            v
                               ┌─────────────────────────┐
                               │  EEG STREAM SIMULATOR   │
                               └────────────┬────────────┘
                                            │
                                            v
                               ┌─────────────────────────┐
                               │   FASTAPI API GATEWAY   │
                               │     & COORDINATOR       │
                               └────────────┬────────────┘
                                            │
                                            v
                               ┌─────────────────────────┐
                               │    REDIS TASK QUEUE     │
                               │   (`eeg_task_queue`)    │
                               └────────────┬────────────┘
                                            │
                 ┌──────────────────────────┼──────────────────────────┐
                 │                          │                          │
                 v                          v                          v
      ┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
      │     WORKER 1       │     │     WORKER 2       │     │     WORKER 3       │
      │ ┌────────────────┐ │     │ ┌────────────────┐ │     │ ┌────────────────┐ │
      │ │ MNE/SciPy Filter│ │     │ │ MNE/SciPy Filter│ │     │ │ MNE/SciPy Filter│ │
      │ ├────────────────┤ │     │ ├────────────────┤ │     │ ├────────────────┤ │
      │ │ PSD Extraction │ │     │ │ PSD Extraction │ │     │ │ PSD Extraction │ │
      │ ├────────────────┤ │     │ ├────────────────┤ │     │ ├────────────────┤ │
      │ │ SVM Inference  │ │     │ │ SVM Inference  │ │     │ │ SVM Inference  │ │
      │ └────────────────┘ │     │ └────────────────┘ │     │ └────────────────┘ │
      └──────────┬─────────┘     └──────────┬─────────┘     └──────────┬─────────┘
                 │                          │                          │
                 └──────────────────────────┼──────────────────────────┘
                                            │
                                            v
                               ┌─────────────────────────┐
                               │   RESULT AGGREGATOR     │
                               │  (`eeg_result_queue`)   │
                               └────────────┬────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │                                               │
                    v                                               v
     ┌─────────────────────────────┐                 ┌─────────────────────────────┐
     │     POSTGRESQL DATABASE     │                 │   WEBSOCKET API BROADCAST   │
     └─────────────────────────────┘                 └──────────────┬──────────────┘
                                                                    │
                                                                    v
                                                     ┌─────────────────────────────┐
                                                     │   REACT + TS DASHBOARD      │
                                                     │  ┌───────────────────────┐  │
                                                     │  │ Virtual BCI Wheelchair│  │
                                                     │  └───────────────────────┘  │
                                                     └─────────────────────────────┘
```

---

## 2. Core Operating Modes

NeuroMesh supports **two distinct EEG input modes**:

### Mode A: Demo Mode (Default & Immediate)
- Generates 64-channel synthetic EEG signals simulating Motor Imagery tasks (`LEFT_HAND`, `RIGHT_HAND`, `REST`).
- Features realistic Event-Related Desynchronization (ERD) spectral power shifts in the $\mu$ (8–12 Hz) and $\beta$ (13–30 Hz) frequency bands over sensorimotor electrodes C3 (channel 10) and C4 (channel 20).
- Signals pass through the full preprocessing, Welch PSD feature extraction, and ML inference pipeline.

### Mode B: Real Dataset Mode (PhysioNet EEG Motor Movement/Imagery)
- Integrates with the public [PhysioNet EEG Motor Movement/Imagery Dataset (eegmmidb)](https://physionet.org/content/eegmmidb/1.0.0/).
- Real 64-channel EDF recordings are downloaded into `data/physionet/`, segmented into 2.0-second sliding windows, and fed into the task coordinator stream.

---

## 3. How This Project Demonstrates Distributed Computing

During an academic viva or evaluation, present these core distributed computing principles implemented in NeuroMesh:

1. **Task-Based Workload Distribution**: Instead of running EEG signal filtering and ML inference on a monolithic loop, the Coordinator decomposes continuous EEG data streams into discrete tasks pushed to a shared Redis Queue (`eeg_task_queue`).
2. **Horizontal Worker Concurrency**: `worker-1`, `worker-2`, and `worker-3` run as distinct, decoupled containers/processes. Workers independently claim tasks from Redis using atomic blocking pop (`BLPOP`), process signals concurrently, and return structured predictions.
3. **Decoupled Asynchronous Aggregation**: The Aggregator service consumes results from `eeg_result_queue`, persists metadata into PostgreSQL, and relays metrics to WebSockets without blocking worker execution.
4. **Fault Tolerance & Heartbeats**: Workers periodically report node health, CPU/memory consumption, and processing latency to PostgreSQL (`worker_metrics`). If a worker container crashes or is stopped, remaining workers automatically process the pending task queue.
5. **Empirical Benchmarking ($S_p = T_1 / T_p$)**: Includes a benchmark evaluator that compares single-node sequential processing against multi-worker queue distribution, calculating the real measured speedup ratio.

---

## 4. Technology Stack

- **Backend Gateway & Coordinator**: Python, FastAPI, WebSockets, Uvicorn
- **EEG Processing Pipeline**: SciPy, MNE-Python, NumPy
- **Machine Learning**: Scikit-Learn (SVM Classifier with RBF kernel), Joblib
- **Message Broker & Queue**: Redis 7
- **Database**: PostgreSQL 15, SQLAlchemy ORM
- **Frontend Dashboard**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Containerization**: Docker, Docker Compose

---

## 5. Quickstart Guide

### Option A: Running via Docker Compose (Recommended)

1. **Train the ML Model** (if not pre-trained):
   ```bash
   python models/train_model.py
   ```

2. **Launch the Container Cluster**:
   ```bash
   docker compose up --build
   ```

3. **Access the Dashboard**:
   - **React Dashboard**: [http://localhost:3000](http://localhost:3000)
   - **FastAPI OpenAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B: Local Multi-Process Mode (No Docker Required)

1. Ensure **Redis** and **PostgreSQL** are running on your machine (or run SQLite/in-memory mode).
2. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   pip install -r worker/requirements.txt
   pip install -r simulator/requirements.txt
   pip install -r aggregator/requirements.txt
   ```
3. Install Frontend dependencies:
   ```bash
   cd frontend && npm install && cd ..
   ```
4. Start all 6 microservices simultaneously:
   ```bash
   python start_local.py
   ```

---

## 6. Centralized vs. Distributed Benchmark Evaluator

NeuroMesh includes a dedicated performance evaluation modal accessible from the React Dashboard.

- **Centralized Execution ($T_1$)**: Tasks are executed sequentially on a single thread/node.
- **Distributed Execution ($T_p$)**: Tasks are distributed across `Worker 1`, `Worker 2`, and `Worker 3` via Redis.
- **Speedup Calculation**:
  $$\text{Speedup } S_p = \frac{T_1}{T_p}$$

---

## 7. 5–10 Minute Academic Video Demonstration Guide

Follow this sequence for video recorded demonstrations:

1. **Step 1**: Run `docker compose up --build`. Show container startup.
2. **Step 2**: Open `http://localhost:3000`. Show `Worker 1`, `Worker 2`, `Worker 3` as `ONLINE`.
3. **Step 3**: Click **START DEMO**.
4. **Step 4**: Observe live EEG waveforms streaming on the visualizer.
5. **Step 5**: Show worker terminal logs (`[WORKER-1] Processed task...`, `[WORKER-2]...`).
6. **Step 6**: Highlight BCI predictions (`LEFT_HAND`, `RIGHT_HAND`, `REST`) and confidence scores.
7. **Step 7**: Watch the **Virtual Assistive Wheelchair** rotate in real time.
8. **Step 8**: Click **RUN BENCHMARK** to display empirical single-node vs distributed speedup stats.
9. **Step 9** (Fault Handling): Stop `worker-2` container (`docker stop neuromesh-worker-2`).
10. **Step 10**: Observe `Worker 2` turn `OFFLINE` on dashboard while `Worker 1` and `Worker 3` continue processing without system disruption.

---

## 8. Testing

Run automated unit and integration tests:
```bash
python -m pytest tests/
```

---

## 9. License

This academic prototype is open-source under the MIT License.
