import numpy as np
import time

class EEGStreamSimulator:
    def __init__(self, n_channels=64, sampling_rate=500, window_sec=2.0):
        self.n_channels = n_channels
        self.sampling_rate = int(sampling_rate)
        self.window_sec = float(window_sec)
        self.n_samples = int(self.sampling_rate * self.window_sec)
        self.sequence_no = 0
        self.classes = ["LEFT_HAND", "RIGHT_HAND", "REST"]

    def generate_chunk(self):
        self.sequence_no += 1
        target = self.classes[(self.sequence_no // 5) % len(self.classes)]
        
        t = np.linspace(0, self.window_sec, self.n_samples, endpoint=False)
        eeg_matrix = np.random.normal(0, 1.5, size=(self.n_channels, self.n_samples))
        
        c3_idx = 10 % self.n_channels
        c4_idx = 20 % self.n_channels
        
        for ch in range(self.n_channels):
            eeg_matrix[ch] += 3.0 * np.sin(2 * np.pi * 10 * t) + 1.5 * np.sin(2 * np.pi * 20 * t)
            
        if target == "LEFT_HAND":
            eeg_matrix[c4_idx] *= 0.3
            eeg_matrix[c3_idx] *= 1.8
        elif target == "RIGHT_HAND":
            eeg_matrix[c3_idx] *= 0.3
            eeg_matrix[c4_idx] *= 1.8
        else:
            eeg_matrix[c3_idx] *= 1.2
            eeg_matrix[c4_idx] *= 1.2
            
        return {
            "sequence_no": self.sequence_no,
            "target_label": target,
            "data_source": "DEMO_SYNTHETIC_EEG",
            "n_channels": self.n_channels,
            "n_samples": self.n_samples,
            "timestamp": time.time(),
            "eeg_data": eeg_matrix.tolist()
        }
