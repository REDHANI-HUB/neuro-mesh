import numpy as np
from scipy.signal import butter, filtfilt, welch

def preprocess_and_extract(eeg_matrix, fs=500):
    eeg_arr = np.array(eeg_matrix)
    n_channels, n_samples = eeg_arr.shape
    
    car_mean = np.mean(eeg_arr, axis=0, keepdims=True)
    car_signal = eeg_arr - car_mean
    
    b, a = butter(5, [8 / (fs/2), 30 / (fs/2)], btype='band')
    filtered = filtfilt(b, a, car_signal, axis=1)
    
    features = []
    log_power = np.log(np.var(filtered, axis=1) + 1e-6)
    features.extend(log_power)
    
    c3_idx = 10 % n_channels
    c4_idx = 20 % n_channels
    
    freqs, psd_c3 = welch(filtered[c3_idx], fs=fs, nperseg=min(n_samples, 256))
    freqs, psd_c4 = welch(filtered[c4_idx], fs=fs, nperseg=min(n_samples, 256))
    
    mu_mask = (freqs >= 8) & (freqs <= 12)
    beta_mask = (freqs >= 13) & (freqs <= 30)
    
    features.append(float(np.mean(psd_c3[mu_mask])) if np.any(mu_mask) else 0.0)
    features.append(float(np.mean(psd_c3[beta_mask])) if np.any(beta_mask) else 0.0)
    features.append(float(np.mean(psd_c4[mu_mask])) if np.any(mu_mask) else 0.0)
    features.append(float(np.mean(psd_c4[beta_mask])) if np.any(beta_mask) else 0.0)
    
    return np.array(features)
