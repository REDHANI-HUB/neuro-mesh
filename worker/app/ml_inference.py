import os
import joblib
import numpy as np

class BCIInferenceEngine:
    def __init__(self, model_path=None):
        if model_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_path = os.path.join(base_dir, "..", "models", "bci_model.joblib")
            if not os.path.exists(model_path):
                model_path = os.path.join(base_dir, "bci_model.joblib")
                
        print(f"Loading trained BCI ML Model from: {model_path}")
        try:
            self.model = joblib.load(model_path)
            self.classes = list(self.model.classes_)
            print(f"Loaded BCI Model with classes: {self.classes}")
        except Exception as e:
            print(f"[WARNING] Could not load model file ({e}). Initializing fallback classifier.")
            self.model = None
            self.classes = ["LEFT_HAND", "RIGHT_HAND", "REST"]

    def predict(self, feature_vector):
        if self.model:
            X = np.array(feature_vector).reshape(1, -1)
            probas = self.model.predict_proba(X)[0]
            best_idx = np.argmax(probas)
            pred_class = str(self.classes[best_idx])
            confidence = float(probas[best_idx])
            proba_dict = {str(c): float(p) for c, p in zip(self.classes, probas)}
            return pred_class, confidence, proba_dict
        else:
            c3_mu = feature_vector[-4]
            c4_mu = feature_vector[-2]
            if c4_mu > c3_mu * 1.3:
                return "LEFT_HAND", 0.92, {"LEFT_HAND": 0.92, "RIGHT_HAND": 0.05, "REST": 0.03}
            elif c3_mu > c4_mu * 1.3:
                return "RIGHT_HAND", 0.94, {"LEFT_HAND": 0.04, "RIGHT_HAND": 0.94, "REST": 0.02}
            else:
                return "REST", 0.89, {"LEFT_HAND": 0.06, "RIGHT_HAND": 0.05, "REST": 0.89}
