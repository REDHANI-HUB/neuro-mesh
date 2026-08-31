import sys
import os
import numpy as np

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "worker", "app"))
from eeg_pipeline import preprocess_and_extract

def test_preprocess_and_extract_shape():
    dummy_eeg = np.random.normal(0, 1, size=(64, 1000)).tolist()
    features = preprocess_and_extract(dummy_eeg, fs=500)
    assert isinstance(features, np.ndarray)
    assert len(features) == 68

def test_preprocess_and_extract_values():
    dummy_eeg = np.random.normal(0, 1, size=(64, 1000)).tolist()
    features = preprocess_and_extract(dummy_eeg, fs=500)
    assert not np.isnan(features).any()
    assert not np.isinf(features).any()
