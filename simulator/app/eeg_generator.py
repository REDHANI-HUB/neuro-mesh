import os
import sys
import time
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from data.dataset_loader import EEGDatasetLoader

ELECTRODE_NAMES = [
    "FC5", "FC3", "FC1", "FCZ", "FC2", "FC4", "FC6", "C5", "C3", "C1",
    "CZ", "C2", "C4", "C6", "CP5", "CP3", "CP1", "CPZ", "CP2", "CP4",
    "CP6", "FP1", "FPZ", "FP2", "AF7", "AF3", "AFZ", "AF4", "AF8", "F7",
    "F5", "F3", "F1", "FZ", "F2", "F4", "F6", "F8", "FT7", "FT8",
    "T7", "T8", "T9", "T10", "TP7", "TP8", "P7", "P5", "P3", "P1",
    "PZ", "P2", "P4", "P6", "P8", "PO7", "PO3", "POZ", "PO4", "PO8",
    "O1", "OZ", "O2", "IZ"
]

class EEGStreamSimulator:
    def __init__(self, n_channels=64, sampling_rate=500, window_sec=2.0):
        self.n_channels = n_channels
        self.sampling_rate = int(sampling_rate)
        self.window_sec = float(window_sec)
        self.n_samples = int(self.sampling_rate * self.window_sec)
        self.sequence_no = 0
        self.classes = ["LEFT_HAND", "RIGHT_HAND", "REST"]
        self.loader = EEGDatasetLoader(n_channels=n_channels, sampling_rate=sampling_rate, window_sec=window_sec)

    def generate_chunk(self, mode="DEMO"):
        self.sequence_no += 1
        target_label = self.classes[(self.sequence_no // 4) % len(self.classes)]
        
        if mode == "PHYSIONET":
            eeg_matrix, data_source, gt_label = self.loader.get_physionet_sample_window(index=self.sequence_no, target_class=target_label)
        else:
            eeg_matrix, data_source, gt_label = self.loader.generate_synthetic_window(target_class=target_label)
            
        if eeg_matrix is None:
            return {
                "sequence_no": self.sequence_no,
                "status": "DATASET_UNAVAILABLE",
                "data_source": "DATASET UNAVAILABLE",
                "message": "PhysioNet EEG dataset files not found in data/sample/. Please switch to DEMO mode."
            }

        eeg_arr = np.array(eeg_matrix, dtype=float)
        
        # Downsampled 6-channel waveform preview for real-time frontend canvas rendering (100 points per channel)
        selected_channels = [8, 12, 10, 33, 50, 60]  # C3, C4, Cz, Fz, Pz, O1
        preview_data = []
        step = max(1, self.n_samples // 100)
        for ch_idx in selected_channels:
            sub = eeg_arr[ch_idx % self.n_channels][::step][:100].tolist()
            preview_data.append(sub)

        # Sensor power features for sensor activity map (C3, Cz, C4)
        c3_power = float(np.var(eeg_arr[8 % self.n_channels]))
        cz_power = float(np.var(eeg_arr[10 % self.n_channels]))
        c4_power = float(np.var(eeg_arr[12 % self.n_channels]))

        return {
            "status": "OK",
            "sequence_no": self.sequence_no,
            "target_label": gt_label,
            "ground_truth_label": gt_label,
            "data_source": data_source,
            "sampling_rate": self.sampling_rate,
            "n_channels": self.n_channels,
            "n_samples": self.n_samples,
            "channel_names": ELECTRODE_NAMES[:self.n_channels],
            "window_start": (self.sequence_no - 1) * self.n_samples,
            "window_end": self.sequence_no * self.n_samples,
            "timestamp": time.time(),
            "eeg_data": eeg_arr.tolist(),
            "waveform_preview": preview_data,
            "sensor_powers": {
                "C3": round(c3_power, 3),
                "Cz": round(cz_power, 3),
                "C4": round(c4_power, 3)
            }
        }
