import os
import json
import numpy as np

try:
    import mne
except ImportError:
    mne = None

class EEGDatasetLoader:
    """
    EEG Dataset Loader for Motor-Imagery Signals.
    Supports Mode A (Synthetic DEMO EEG with ERD signatures) and Mode B (Public PhysioNet EEG Dataset).
    """
    def __init__(self, n_channels=64, sampling_rate=500, window_sec=2.0):
        self.n_channels = n_channels
        self.sampling_rate = int(sampling_rate)
        self.window_sec = float(window_sec)
        self.n_samples = int(self.sampling_rate * self.window_sec)
        self.classes = ["LEFT_HAND", "RIGHT_HAND", "REST"]
        self.sample_dir = os.path.join(os.path.dirname(__file__), "sample")
        self.sample_file = os.path.join(self.sample_dir, "eegmmidb_sample.json")
        self.metadata_file = os.path.join(self.sample_dir, "metadata.json")
        self.sample_cache = None

    def generate_synthetic_window(self, target_class="REST"):
        """
        Mode A: Generates realistic synthetic EEG signals simulating Motor Imagery Event-Related
        Desynchronization (ERD) over C3 (ch 10) and C4 (ch 20) in mu (8-12 Hz) & beta (13-30 Hz) bands.
        """
        t = np.linspace(0, self.window_sec, self.n_samples, endpoint=False)
        window = np.random.normal(0, 1.2, size=(self.n_channels, self.n_samples))
        
        c3_idx = 10 % self.n_channels
        c4_idx = 20 % self.n_channels
        
        for ch in range(self.n_channels):
            window[ch] += 2.5 * np.sin(2 * np.pi * 10 * t) + 1.2 * np.sin(2 * np.pi * 20 * t)
            
        if target_class == "LEFT_HAND":
            window[c4_idx] *= 0.35  # Right hemisphere ERD
            window[c3_idx] *= 1.65  # Left hemisphere ERS
        elif target_class == "RIGHT_HAND":
            window[c3_idx] *= 0.35  # Left hemisphere ERD
            window[c4_idx] *= 1.65  # Right hemisphere ERS
        else:
            window[c3_idx] *= 1.1
            window[c4_idx] *= 1.1
            
        return window.tolist(), "SIMULATED EEG (DEMO MODE)", target_class

    def get_physionet_sample_window(self, index=0, target_class="REST"):
        """
        Mode B: Loads authentic EEG windows from PhysioNet Motor Movement/Imagery dataset (EEGMMIDB).
        Strictly returns DATASET UNAVAILABLE if real dataset files are missing.
        """
        if self.sample_cache is None and os.path.exists(self.sample_file):
            try:
                with open(self.sample_file, "r") as f:
                    self.sample_cache = json.load(f)
            except Exception as e:
                print(f"[DATASET WARNING] Could not read sample dataset file: {e}")
                self.sample_cache = None

        if self.sample_cache and len(self.sample_cache) > 0:
            item = self.sample_cache[index % len(self.sample_cache)]
            label = item.get("label", target_class)
            return item["data"], "PhysioNet EEGMMIDB (S001R04.edf)", label

        # Fallback to direct PhysioNet EDF files via MNE if sample cache not generated
        if mne is not None and os.path.exists(self.sample_dir):
            try:
                edf_files = [os.path.join(self.sample_dir, f) for f in os.listdir(self.sample_dir) if f.endswith('.edf')]
                if edf_files:
                    raw = mne.io.read_raw_edf(edf_files[0], preload=True, verbose=False)
                    raw.resample(self.sampling_rate, verbose=False)
                    data = raw.get_data()
                    n_tot_ch, tot_samp = data.shape
                    start = (index * self.n_samples) % max(1, tot_samp - self.n_samples)
                    win = data[:min(n_tot_ch, self.n_channels), start:start+self.n_samples]
                    if win.shape[0] < self.n_channels:
                        pad = np.zeros((self.n_channels - win.shape[0], self.n_samples))
                        win = np.vstack([win, pad])
                    return win.tolist(), f"PhysioNet EEGMMIDB ({os.path.basename(edf_files[0])})", target_class
            except Exception as e:
                print(f"[DATASET ERROR] EDF load error: {e}")

        # Strict requirement: Never silently fake PhysioNet dataset mode!
        return None, "DATASET UNAVAILABLE", "N/A"

    def get_dataset_metadata(self):
        """Returns JSON metadata for data provenance tracking."""
        if os.path.exists(self.metadata_file):
            try:
                with open(self.metadata_file, "r") as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "dataset_name": "PhysioNet EEG Motor Movement/Imagery Dataset (EEGMMIDB)",
            "source": "PhysioNet / NINDS",
            "subject": "S001",
            "sampling_frequency_hz": 160.0,
            "n_channels": 64,
            "motor_imagery_classes": ["LEFT_HAND", "RIGHT_HAND", "REST"]
        }

    def get_demo_batch(self, batch_size=30):
        X, y = [], []
        for i in range(batch_size):
            label = self.classes[i % len(self.classes)]
            win, source, _ = self.generate_synthetic_window(target_class=label)
            X.append(win)
            y.append(label)
        return np.array(X), np.array(y)
