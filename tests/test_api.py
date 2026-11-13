import sys
import os
from fastapi.testclient import TestClient

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))
from app.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["ONLINE", "DEGRADED", "OFFLINE"]

def test_api_status():
    res = client.get("/api/status")
    assert res.status_code == 200
    data = res.json()
    assert "stream_status" in data
    assert "dataset_mode" in data

def test_api_model_info():
    res = client.get("/api/model_info")
    assert res.status_code == 200
    data = res.json()
    assert "model_name" in data
    assert "accuracy" in data

def test_api_dataset_info():
    res = client.get("/api/dataset_info")
    assert res.status_code == 200
    data = res.json()
    assert "dataset_name" in data

def test_api_benchmark():
    res = client.post("/api/benchmark", json={"task_count": 10})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["SUCCESS", "UNAVAILABLE"]
