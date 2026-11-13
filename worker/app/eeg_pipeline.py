import numpy as np
from scipy.signal import butter, filtfilt, welch, iirnotch

try:
    import mne
except ImportError:
    mne = None

ELECTRODE_NAMES = [
    "FC5", "FC3", "FC1", "FCZ", "FC2", "FC4", "FC6", "C5", "C3", "C1",
    "CZ", "C2", "C4", "C6", "CP5", "CP3", "CP1", "CPZ", "CP2", "CP4",
    "CP6", "FP1", "FPZ", "FP2", "AF7", "AF3", "AFZ", "AF4", "AF8", "F7",
    "F5", "F3", "F1", "FZ", "F2", "F4", "F6", "F8", "FT7", "FT8",
    "T7", "T8", "T9", "T10", "TP7", "TP8", "P7", "P5", "P3", "P1",
    "PZ", "P2", "P4", "P6", "P8", "PO7", "PO3", "POZ", "PO4", "PO8",
    "O1", "OZ", "O2", "IZ"
]

def preprocess_and_extract(eeg_matrix, fs=500):
    """
    Complete MNE/SciPy Signal Processing Pipeline:
    1. Common Average Reference (CAR) Re-referencing
    2. 50 Hz Power-Line Notch Filter
    3. 8-30 Hz Butterworth Bandpass Filter
    4. Feature Extraction (Log-variance, Welch PSD Mu/Beta, Hemispheric Asymmetry & C3/C4 Ratio)
    """
    eeg_arr = np.array(eeg_matrix, dtype=float)
    n_channels, n_samples = eeg_arr.shape

    # 1. Common Average Reference (CAR)
    car_mean = np.mean(eeg_arr, axis=0, keepdims=True)
    car_signal = eeg_arr - car_mean

    # 2. 50 Hz Notch Filter
    if fs > 100:
        b_notch, a_notch = iirnotch(50.0, Q=30.0, fs=fs)
        notched = filtfilt(b_notch, a_notch, car_signal, axis=1)
    else:
        notched = car_signal

    # 3. 8-30 Hz Butterworth Bandpass Filter
    b_band, a_band = butter(4, [8.0, 30.0], btype='band', fs=fs)
    filtered = filtfilt(b_band, a_band, notched, axis=1)

    # 4. Feature Extraction
    features = []

    # A. Channel Log Variance (64 features)
    log_power = np.log(np.var(filtered, axis=1) + 1e-6)
    features.extend(log_power.tolist())

    # B. Channel Index Mapping for C3 (Left Motor) and C4 (Right Motor)
    c3_idx = 8 if n_channels == 64 else (10 % n_channels)
    c4_idx = 12 if n_channels == 64 else (20 % n_channels)

    freqs, psd_c3 = welch(filtered[c3_idx], fs=fs, nperseg=min(n_samples, 256))
    freqs, psd_c4 = welch(filtered[c4_idx], fs=fs, nperseg=min(n_samples, 256))

    mu_mask = (freqs >= 8) & (freqs <= 12)
    beta_mask = (freqs >= 13) & (freqs <= 30)

    c3_mu = float(np.mean(psd_c3[mu_mask])) if np.any(mu_mask) else 1e-6
    c3_beta = float(np.mean(psd_c3[beta_mask])) if np.any(beta_mask) else 1e-6
    c4_mu = float(np.mean(psd_c4[mu_mask])) if np.any(mu_mask) else 1e-6
    c4_beta = float(np.mean(psd_c4[beta_mask])) if np.any(beta_mask) else 1e-6

    # C. Power Ratio & Hemispheric Asymmetry Features
    c3_c4_ratio = float(np.log((c3_mu + 1e-6) / (c4_mu + 1e-6)))
    asymmetry = float((c4_mu - c3_mu) / (c4_mu + c3_mu + 1e-6))

    features.append(c3_mu)
    features.append(c3_beta)
    features.append(c4_mu)
    features.append(c4_beta)

    return np.array(features, dtype=float)
