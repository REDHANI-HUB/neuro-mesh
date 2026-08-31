import sys
import os

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "simulator", "app"))
from eeg_generator import EEGStreamSimulator

def test_eeg_stream_simulator():
    sim = EEGStreamSimulator(n_channels=64, sampling_rate=500, window_sec=2.0)
    chunk = sim.generate_chunk()
    
    assert chunk["sequence_no"] == 1
    assert chunk["n_channels"] == 64
    assert chunk["n_samples"] == 1000
    assert len(chunk["eeg_data"]) == 64
