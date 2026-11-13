import os
import json
import joblib
import numpy as np

class BCIInferenceEngine:
    def __init__(self, model_path=None):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if model_path is None:
            model_path = os.path.join(base_dir, "models", "bci_model.joblib")

        meta_path = os.path.join(base_dir, "models", "model_metadata.json")

        self.metadata = {
            "model_name": "Support Vector Classifier (SVM-RBF)",
            "model_version": "v1.0.0",
            "training_dataset": "PhysioNet EEGMMIDB",
            "feature_version": "MNE-Notched 68-Dim"
        }

        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r") as f:
                    self.metadata.update(json.load(f))
            except Exception:
                pass

        print(f"[ML INFERENCE] Loading BCI Model pipeline from: {model_path}")
        try:
            self.model = joblib.load(model_path)
            self.classes = list(self.model.classes_)
            print(f"[ML INFERENCE] Successfully loaded BCI Model with classes: {self.classes}")
        except Exception as e:
            print(f"[ML INFERENCE ERROR] Could not load model file ({e}). Marking model as unavailable.")
            self.model = None
            self.classes = ["LEFT_HAND", "RIGHT_HAND", "REST"]

    def predict(self, feature_vector):
        """
        Runs model inference on feature vector.
        Strict requirement: Returns MODEL UNAVAILABLE if trained model pipeline is missing.
        """
        if self.model is None:
            return "MODEL UNAVAILABLE", 0.0, {"LEFT_HAND": 0.0, "RIGHT_HAND": 0.0, "REST": 0.0}

        try:
            X = np.array(feature_vector, dtype=float).reshape(1, -1)
            probas = self.model.predict_proba(X)[0]
            best_idx = int(np.argmax(probas))
            pred_class = str(self.classes[best_idx])
            confidence = float(probas[best_idx])
            proba_dict = {str(c): round(float(p), 4) for c, p in zip(self.classes, probas)}
            return pred_class, confidence, proba_dict
        except Exception as e:
            print(f"[ML INFERENCE PREDICT ERROR] {e}")
            return "MODEL UNAVAILABLE", 0.0, {}
