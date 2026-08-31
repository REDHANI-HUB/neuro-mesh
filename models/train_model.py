import os
import sys
import numpy as np
from scipy.signal import butter, filtfilt, welch
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data.dataset_loader import EEGDatasetLoader

def extract_features(eeg_matrix, fs=500):
    eeg_arr = np.array(eeg_matrix)
    n_channels, n_samples = eeg_arr.shape
    
    b, a = butter(4, [8 / (fs/2), 30 / (fs/2)], btype='band')
    filtered = filtfilt(b, a, eeg_arr, axis=1)
    
    features = []
    log_power = np.log(np.var(filtered, axis=1) + 1e-6)
    features.extend(log_power)
    
    c3_idx = 10 % n_channels
    c4_idx = 20 % n_channels
    
    freqs, psd_c3 = welch(filtered[c3_idx], fs=fs, nperseg=min(n_samples, 256))
    freqs, psd_c4 = welch(filtered[c4_idx], fs=fs, nperseg=min(n_samples, 256))
    
    mu_mask = (freqs >= 8) & (freqs <= 12)
    beta_mask = (freqs >= 13) & (freqs <= 30)
    
    features.append(np.mean(psd_c3[mu_mask]) if np.any(mu_mask) else 0.0)
    features.append(np.mean(psd_c3[beta_mask]) if np.any(beta_mask) else 0.0)
    features.append(np.mean(psd_c4[mu_mask]) if np.any(mu_mask) else 0.0)
    features.append(np.mean(psd_c4[beta_mask]) if np.any(beta_mask) else 0.0)
    
    return np.array(features)

def train_and_save_model():
    print("Generating motor-imagery training dataset...")
    loader = EEGDatasetLoader(n_channels=64, sampling_rate=500, window_sec=2.0)
    
    X_raw, y_raw = loader.get_demo_batch(batch_size=180)
    X_features = np.array([extract_features(win) for win in X_raw])
    
    X_train, X_test, y_train, y_test = train_test_split(X_features, y_raw, test_size=0.25, random_state=42)
    
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', SVC(kernel='rbf', C=1.0, probability=True, random_state=42))
    ])
    
    pipeline.fit(X_train, y_train)
    
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Model Training Complete! Test Accuracy: {acc * 100:.2f}%")
    
    model_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(model_dir, "bci_model.joblib")
    joblib.dump(pipeline, model_path)
    print(f"Saved trained BCI model to: {model_path}")

if __name__ == "__main__":
    train_and_save_model()
