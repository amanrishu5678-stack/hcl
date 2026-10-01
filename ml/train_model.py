from pathlib import Path
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest

rng = np.random.default_rng(42)
normal = np.column_stack([
    rng.normal(62, 5, 1000),
    rng.normal(2.0, .35, 1000),
    rng.normal(7.5, 1.2, 1000),
    rng.normal(230, 4, 1000),
    rng.normal(5.5, .5, 1000),
    rng.normal(1450, 100, 1000),
    rng.normal(3000, 400, 1000)
])
model = IsolationForest(n_estimators=200, contamination=.03, random_state=42)
model.fit(normal)
out = Path("backend/app/ml_models")
out.mkdir(parents=True, exist_ok=True)
joblib.dump(model, out/"isolation_forest.joblib")
print("Saved", out/"isolation_forest.joblib")
