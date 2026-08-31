import sys
import os
import numpy as np

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "worker", "app"))
from ml_inference import BCIInferenceEngine

def test_inference_engine_prediction():
    engine = BCIInferenceEngine()
    dummy_features = np.random.normal(0, 1, size=68)
    pred_class, conf, probas = engine.predict(dummy_features)
    
    assert pred_class in ["LEFT_HAND", "RIGHT_HAND", "REST"]
    assert 0.0 <= conf <= 1.0
    assert isinstance(probas, dict)
