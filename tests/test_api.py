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
    assert data["status"] == "HEALTHY"

def test_api_benchmark():
    res = client.post("/api/benchmark", json={"task_count": 10})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert "speedup" in data
