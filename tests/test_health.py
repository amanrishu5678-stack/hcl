import sys
sys.path.insert(0, "backend")
from app.health import calculate_health
from app.schemas import Telemetry
from datetime import datetime, timezone

def make(**kw):
    d=dict(device_id="d",equipment_id="CNC-042",timestamp=datetime.now(timezone.utc),
           temperature=62,vibration=2,current=7,voltage=230,pressure=5,rpm=1450,runtime_hours=1)
    d.update(kw)
    return Telemetry(**d)

def test_normal_health():
    r=calculate_health(make(),False)
    assert 75 <= r.score <= 100

def test_vibration_reduces_health():
    r=calculate_health(make(vibration=10),True)
    assert r.score < 75
