from dataclasses import dataclass

@dataclass
class ScoreResult:
    score: float
    status: str
    risk: str
    explanation: str

def _range_score(value, normal_low, normal_high, critical_low, critical_high):
    if normal_low <= value <= normal_high:
        return 100.0
    if value < normal_low:
        if value <= critical_low: return 0.0
        return max(0, 100 * (value-critical_low)/(normal_low-critical_low))
    if value >= critical_high:
        return 0.0
    return max(0, 100 * (critical_high-value)/(critical_high-normal_high))

def calculate_health(t, anomaly=False):
    parts = {
        "temperature": _range_score(t.temperature, 35, 75, 0, 110),
        "vibration": _range_score(t.vibration, 0, 3.5, 8, 12),
        "current": _range_score(t.current, 2, 12, 0, 30),
        "voltage": _range_score(t.voltage, 210, 245, 170, 280),
        "rpm": _range_score(t.rpm, 900, 1800, 400, 2600),
        "pressure": _range_score(t.pressure, 3, 8, 0, 15),
    }
    weights = {"temperature": .20, "vibration": .30, "current": .15, "voltage": .10, "rpm": .10, "pressure": .10}
    score = sum(parts[k] * weights[k] for k in weights) - (5 if anomaly else 0)
    score = round(max(0, min(100, score)), 1)

    if score >= 90: status, risk = "EXCELLENT", "LOW"
    elif score >= 75: status, risk = "HEALTHY", "LOW"
    elif score >= 60: status, risk = "ATTENTION", "MEDIUM"
    elif score >= 40: status, risk = "WARNING", "HIGH"
    else: status, risk = "CRITICAL", "CRITICAL"

    contributors = sorted(parts.items(), key=lambda x: x[1])
    explanation = "; ".join(f"{k} condition score {v:.0f}/100" for k, v in contributors[:3])
    if anomaly:
        explanation += "; AI anomaly detected in operating pattern"
    return ScoreResult(score, status, risk, explanation)
