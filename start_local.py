import os
import sys
import subprocess
import time

def main():
    print("==================================================================")
    print("NEUROMESH: LOCAL MULTI-PROCESS DISTRIBUTED RUNNER")
    print("==================================================================")
    print("Starting all 6 microservices as independent processes...")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    processes = []

    def spawn_process(name, cmd, cwd, env_extra=None):
        env = os.environ.copy()
        if env_extra:
            env.update(env_extra)
        print(f"[LAUNCHER] Starting {name}...")
        p = subprocess.Popen(cmd, cwd=cwd, env=env, shell=True)
        processes.append((name, p))
        return p

    try:
        # 1. Backend Service
        backend_dir = os.path.join(base_dir, "backend")
        spawn_process("Backend FastAPI Gateway", [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000"], backend_dir)
        time.sleep(2)

        # 2. Worker 1
        worker_dir = os.path.join(base_dir, "worker")
        spawn_process("Worker 1", [sys.executable, "app/main.py"], worker_dir, {"WORKER_ID": "worker-1"})

        # 3. Worker 2
        spawn_process("Worker 2", [sys.executable, "app/main.py"], worker_dir, {"WORKER_ID": "worker-2"})

        # 4. Worker 3
        spawn_process("Worker 3", [sys.executable, "app/main.py"], worker_dir, {"WORKER_ID": "worker-3"})

        # 5. Aggregator
        agg_dir = os.path.join(base_dir, "aggregator")
        spawn_process("Result Aggregator", [sys.executable, "app/main.py"], agg_dir)

        # 6. Simulator
        sim_dir = os.path.join(base_dir, "simulator")
        spawn_process("EEG Simulator", [sys.executable, "app/main.py"], sim_dir)

        # 7. Frontend
        frontend_dir = os.path.join(base_dir, "frontend")
        spawn_process("React Frontend", "npm run dev", frontend_dir)

        print("\nAll NeuroMesh microservices launched successfully!")
        print("React Dashboard URL : http://localhost:3000")
        print("Backend API URL     : http://localhost:8000/docs")
        print("Press Ctrl+C to stop all services.\n")

        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nShutting down all microservice processes...")
        for name, p in processes:
            print(f"Terminating {name}...")
            p.terminate()
        sys.exit(0)

if __name__ == "__main__":
    main()
