import os
import sys
import json
import numpy as np
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, precision_recall_fscore_support, confusion_matrix
import joblib

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data.dataset_loader import EEGDatasetLoader
from worker.app.eeg_pipeline import preprocess_and_extract

def train_and_save_model():
    print("[TRAINING] Initializing Motor Imagery Dataset Loader...")
    loader = EEGDatasetLoader(n_channels=64, sampling_rate=500, window_sec=2.0)
    
    # Train on dataset windows
    X_raw, y_raw = loader.get_demo_batch(batch_size=240)
    print(f"[TRAINING] Extracting 68 MNE/SciPy features for {len(X_raw)} windows...")
    X_features = np.array([preprocess_and_extract(win) for win in X_raw])
    
    X_train, X_test, y_train, y_test = train_test_split(X_features, y_raw, test_size=0.25, random_state=42)
    
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', SVC(kernel='rbf', C=1.5, probability=True, random_state=42))
    ])
    
    pipeline.fit(X_train, y_train)
    
    y_pred = pipeline.predict(X_test)
    acc = float(accuracy_score(y_test, y_pred))
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted')
    cm = confusion_matrix(y_test, y_pred, labels=list(pipeline.classes_)).tolist()
    
    print(f"[TRAINING COMPLETE] Accuracy: {acc * 100:.2f}% | F1-Score: {f1 * 100:.2f}%")
    
    model_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(model_dir, "bci_model.joblib")
    meta_path = os.path.join(model_dir, "model_metadata.json")
    
    joblib.dump(pipeline, model_path)
    print(f"[TRAINING] Saved trained BCI model pipeline to: {model_path}")
    
    metadata = {
        "model_name": "Support Vector Classifier (SVM-RBF)",
        "model_version": "v1.0.0",
        "training_dataset": "PhysioNet EEGMMIDB / Motor Imagery Dataset",
        "feature_version": "MNE-Notched 68-Dim Feature Vector",
        "accuracy": round(acc, 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "classes": list(pipeline.classes_),
        "confusion_matrix": cm
    }
    
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"[TRAINING] Saved model metadata to: {meta_path}")

if __name__ == "__main__":
    train_and_save_model()
