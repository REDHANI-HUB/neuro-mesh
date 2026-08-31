import os
import numpy as np
try:
    import mne
except ImportError:
    mne = None

class EEGDatasetLoader:
    """
    EEG Dataset Loader for Motor-Imagery Signals.
    Supports synthetic EEG generation (labelled DEMO DATA) and PhysioNet EDF files.
    """
    def __init__(self, n_channels=64, sampling_rate=500, window_sec=2.0):
        self.n_channels = n_channels
        self.sampling_rate = int(sampling_rate)
        self.window_sec = float(window_sec)
        self.n_samples = int(self.sampling_rate * self.window_sec)
        self.classes = ["LEFT_HAND", "RIGHT_HAND", "REST"]

    def generate_synthetic_window(self, target_class="REST"):
        t = np.linspace(0, self.window_sec, self.n_samples, endpoint=False)
        window = np.random.normal(0, 1.5, size=(self.n_channels, self.n_samples))
        
        c3_idx = 10 % self.n_channels
        c4_idx = 20 % self.n_channels
        
        for ch in range(self.n_channels):
            window[ch] += 3.0 * np.sin(2 * np.pi * 10 * t) + 1.5 * np.sin(2 * np.pi * 20 * t)
            
        if target_class == "LEFT_HAND":
            window[c4_idx] *= 0.3
            window[c3_idx] *= 1.8
        elif target_class == "RIGHT_HAND":
            window[c3_idx] *= 0.3
            window[c4_idx] *= 1.8
        else:
            window[c3_idx] *= 1.2
            window[c4_idx] *= 1.2
            
        return window.tolist(), "DEMO_SYNTHETIC"

    def load_physionet_data(self, subject=1, runs=[4, 8, 12]):
        """
        Mode B: Load real PhysioNet Motor Movement/Imagery Dataset (eegmmidb).
        Runs 4, 8, 12 typically correspond to motor imagery (left hand vs right hand).
        """
        if mne is None:
            print("[DATASET] MNE package not available. Falling back to synthetic DEMO mode.")
            return self.get_demo_batch(batch_size=30)
        
        try:
            raw_fnames = mne.datasets.eegbci.load_data(subject, runs, path=os.path.join(os.path.dirname(__file__), "physionet"))
            raws = [mne.io.read_raw_edf(f, preload=True, verbose=False) for f in raw_fnames]
            raw = mne.io.concatenate_raws(raws, verbose=False)
            
            # Resample and match channel expectations
            raw.resample(self.sampling_rate, verbose=False)
            data = raw.get_data() # (n_channels, total_samples)
            
            # Epoch into windows
            n_tot_channels, total_samples = data.shape
            n_windows = total_samples // self.n_samples
            
            X, y = [], []
            labels = ["LEFT_HAND", "RIGHT_HAND", "REST"]
            for i in range(n_windows):
                start = i * self.n_samples
                end = start + self.n_samples
                win = data[:min(n_tot_channels, self.n_channels), start:end]
                if win.shape[0] < self.n_channels:
                    pad = np.zeros((self.n_channels - win.shape[0], self.n_samples))
                    win = np.vstack([win, pad])
                X.append(win.tolist())
                y.append(labels[i % len(labels)])
                
            return np.array(X), np.array(y)
        except Exception as e:
            print(f"[DATASET WARNING] PhysioNet download/load error: {e}. Falling back to synthetic DEMO mode.")
            return self.get_demo_batch(batch_size=30)

    def get_demo_batch(self, batch_size=30):
        X = []
        y = []
        for i in range(batch_size):
            label = self.classes[i % len(self.classes)]
            win, source = self.generate_synthetic_window(target_class=label)
            X.append(win)
            y.append(label)
        return np.array(X), np.array(y)

