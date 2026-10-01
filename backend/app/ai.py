from pathlib import Path
import joblib
import numpy as np
from .config import settings

class AnomalyDetector:
    def __init__(self):
        self.model = None
        self.status = "FALLBACK MODE"
        self.model_info = "Deterministic industrial heuristics"

    def load(self):
        path = Path(settings.model_dir) / "isolation_forest.joblib"
        if path.exists():
            try:
                self.model = joblib.load(path)
                self.status = "ONLINE"
                self.model_info = "Isolation Forest"
            except Exception:
                self.model = None

    def features(self, t):
        return np.array([[t.temperature, t.vibration, t.current, t.voltage, t.pressure, t.rpm, t.runtime_hours]])

    def predict(self, t):
        if self.model is not None:
            pred = int(self.model.predict(self.features(t))[0])
            return pred == -1
        return (
            t.temperature > 90 or
            t.vibration > 7 or
            t.current > 18 or
            t.voltage < 195 or t.voltage > 255 or
            t.rpm < 650 or t.rpm > 2250 or
            t.pressure < 1.5 or t.pressure > 11
        )

detector = AnomalyDetector()
detector.load()
