from datetime import datetime, timezone, timedelta
from .models import Equipment, User, MaintenanceRecord, SensorReading, HealthScore, Alert
from .security import hash_password

EQUIPMENT = [
    ("CNC-042","CNC Machine","CNC","Bay 2","Line A"),
    ("PMP-017","Hydraulic Pump","Pump","Bay 1","Line A"),
    ("MTR-021","Industrial Motor","Motor","Bay 3","Line B"),
    ("CMP-009","Compressor","Compressor","Utility","Line C"),
    ("CVM-031","Conveyor Motor","Motor","Bay 4","Line B"),
]

def seed(db):
    now = datetime.now(timezone.utc)
    if db.query(Equipment).count() == 0:
        for idx,(eid,name,typ,loc,line) in enumerate(EQUIPMENT):
            health = [94, 88, 79, 67, 91][idx]
            status = "EXCELLENT" if health >= 90 else "HEALTHY" if health >= 75 else "ATTENTION"
            db.add(Equipment(
                equipment_id=eid, name=name, type=typ,
                manufacturer="InduMotion", model="IM-500",
                location=loc, production_line=line,
                department="Production", device_id=f"ESP32-{eid}",
                operating_hours=2500 + idx*420, health_score=health,
                status=status, risk_level="LOW" if health >= 75 else "MEDIUM",
                last_maintenance=now-timedelta(days=18+idx*4),
                next_maintenance=now+timedelta(days=12-idx), last_seen=now
            ))
        db.flush()

    if db.query(User).count() == 0:
        db.add(User(email="admin@indusense.local", password_hash=hash_password("Admin@123"), role="ADMIN"))
        db.add(User(email="engineer@indusense.local", password_hash=hash_password("Engineer@123"), role="ENGINEER"))

    # Seed a compact 24-hour telemetry history so the dashboard is immediately useful.
    if db.query(SensorReading).count() == 0:
        import math, random
        for eq_index, (eid, *_rest) in enumerate(EQUIPMENT):
            for i in range(48):
                ts = now - timedelta(minutes=(47-i)*30)
                phase = i / 47
                drift = max(0, phase - 0.72) * 2
                temp = 60 + eq_index*2 + 2*math.sin(i/6) + drift*10
                vib = 1.8 + eq_index*.18 + .35*math.sin(i/5) + drift*3
                current = 7.0 + eq_index*.35 + .5*math.sin(i/7) + drift*2
                voltage = 230 + 2*math.sin(i/8)
                pressure = 5.2 + .25*math.sin(i/6)
                rpm = 1450 - eq_index*35 + 45*math.sin(i/5) - drift*130
                db.add(SensorReading(equipment_id=eid, timestamp=ts,
                    temperature=round(temp+random.uniform(-.4,.4),2),
                    vibration=round(max(0,vib+random.uniform(-.08,.08)),2),
                    current=round(current+random.uniform(-.2,.2),2),
                    voltage=round(voltage+random.uniform(-.8,.8),2),
                    pressure=round(pressure+random.uniform(-.05,.05),2),
                    rpm=round(max(0,rpm+random.uniform(-12,12)),1),
                    runtime_hours=2500+eq_index*420+i/2))

    if db.query(HealthScore).count() == 0:
        for idx,(eid,*_) in enumerate(EQUIPMENT):
            eq = db.query(Equipment).filter_by(equipment_id=eid).first()
            db.add(HealthScore(equipment_id=eid, timestamp=now, score=eq.health_score,
                status=eq.status, risk_level=eq.risk_level,
                explanation="Baseline seeded from validated demo telemetry."))

    if db.query(Alert).count() == 0:
        db.add(Alert(equipment_id="CVM-031", timestamp=now-timedelta(minutes=11),
            severity="WARNING", sensor="vibration", observed_value=5.8,
            expected_range="0–3.5", description="Vibration is trending above the configured normal band.",
            recommended_action="Inspect bearing condition and alignment during the next planned inspection."))
        db.add(Alert(equipment_id="CMP-009", timestamp=now-timedelta(minutes=37),
            severity="INFO", sensor="AI", observed_value=None,
            expected_range="Model baseline", description="AI model detected a mild operating-pattern deviation.",
            recommended_action="Review recent load profile and confirm process conditions."))

    db.commit()

