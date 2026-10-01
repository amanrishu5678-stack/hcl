import json
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, Depends, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
try:
    import paho.mqtt.client as mqtt
except ImportError:
    mqtt = None

from .config import settings
from .db import Base, engine, get_db
from .models import Equipment, SensorReading, HealthScore, Alert, MaintenanceRecord
from .schemas import Telemetry, LoginRequest
from .health import calculate_health
from .ai import detector
from .seed import seed
from .ws import connect, disconnect, broadcast

app = FastAPI(title="INDUSENSE AI", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[x.strip() for x in settings.cors_origins.split(",")],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

Base.metadata.create_all(bind=engine)


def init():
    db = next(get_db())
    try: seed(db)
    finally: db.close()

init()

def process_telemetry(t: Telemetry):
    db = next(get_db())
    try:
        eq = db.query(Equipment).filter_by(equipment_id=t.equipment_id).first()
        if not eq:
            raise ValueError("Unknown equipment")
        anomaly = detector.predict(t)
        result = calculate_health(t, anomaly)
        db.add(SensorReading(
            equipment_id=t.equipment_id, timestamp=t.timestamp,
            temperature=t.temperature, vibration=t.vibration, current=t.current,
            voltage=t.voltage, pressure=t.pressure, rpm=t.rpm,
            runtime_hours=t.runtime_hours
        ))
        db.add(HealthScore(
            equipment_id=t.equipment_id, timestamp=t.timestamp,
            score=result.score, status=result.status, risk_level=result.risk,
            explanation=result.explanation
        ))
        eq.health_score, eq.status, eq.risk_level, eq.last_seen = result.score, result.status, result.risk, t.timestamp

        created_alert = None
        checks = [
            ("temperature", t.temperature > 90, t.temperature, "35–75", "High temperature; inspect cooling system."),
            ("vibration", t.vibration > 7, t.vibration, "0–3.5", "Elevated vibration; inspect bearings/alignment."),
            ("current", t.current > 18, t.current, "2–12", "High current; inspect load and motor."),
            ("voltage", t.voltage < 195 or t.voltage > 255, t.voltage, "210–245", "Voltage outside configured demo range."),
            ("AI", anomaly, None, "Model baseline", "Inspect machine operating pattern.")
        ]
        for sensor, bad, value, expected, action in checks:
            if bad:
                recent_cutoff = t.timestamp - timedelta(minutes=5)
                existing = db.query(Alert).filter(
                    Alert.equipment_id == t.equipment_id,
                    Alert.sensor == sensor,
                    Alert.resolved == False,
                    Alert.timestamp >= recent_cutoff
                ).first()
                if not existing:
                    severity = "CRITICAL" if result.score < 40 else "HIGH" if result.score < 60 else "WARNING"
                    created_alert = Alert(
                        equipment_id=t.equipment_id, timestamp=t.timestamp,
                        severity=severity, sensor=sensor, observed_value=value,
                        expected_range=expected,
                        description=f"{sensor.title()} anomaly detected on {t.equipment_id}.",
                        recommended_action=action
                    )
                    db.add(created_alert)
                break
        db.commit()
        payload = {
            "type": "telemetry",
            "equipment_id": t.equipment_id,
            "health": result.score, "status": result.status,
            "risk": result.risk, "anomaly": anomaly,
            "temperature": t.temperature, "vibration": t.vibration,
            "current": t.current, "voltage": t.voltage,
            "pressure": t.pressure, "rpm": t.rpm,
            "timestamp": t.timestamp.isoformat()
        }
        return payload
    finally:
        db.close()

def mqtt_on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        t = Telemetry.model_validate(data)
        import asyncio
        asyncio.run(broadcast(process_telemetry(t)))
    except Exception as exc:
        print("Rejected MQTT message:", exc)

mqtt_client = None

def mqtt_connect():
    global mqtt_client
    if not settings.mqtt_enabled or mqtt is None:
        return False
    try:
        mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        mqtt_client.on_message = mqtt_on_message
        mqtt_client.connect(settings.mqtt_host, settings.mqtt_port, 60)
        mqtt_client.subscribe("industrial/+/telemetry", qos=1)
        mqtt_client.loop_start()
        return True
    except Exception as exc:
        print("MQTT unavailable:", exc)
        return False

mqtt_connected = mqtt_connect()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "indusense-api", "version": "1.0.0"}

@app.post("/api/telemetry")
async def ingest_telemetry(t: Telemetry):
    """HTTP fallback for devices/gateways that cannot publish MQTT directly."""
    payload = process_telemetry(t)
    await broadcast(payload)
    return payload

@app.get("/api/system/status")
def system_status(db: Session = Depends(get_db)):
    latest = db.query(SensorReading).order_by(desc(SensorReading.timestamp)).first()
    return {
        "backend": "ONLINE",
        "database": "ONLINE",
        "mqtt": "CONNECTED" if mqtt_connected else "LOCAL HTTP MODE",
        "ai": detector.status,
        "websocket": "READY",
        "last_telemetry": latest.timestamp if latest else None
    }

@app.get("/api/equipment")
def equipment(db: Session = Depends(get_db)):
    return db.query(Equipment).all()

@app.get("/api/equipment/{equipment_id}")
def equipment_detail(equipment_id: str, db: Session = Depends(get_db)):
    eq = db.query(Equipment).filter_by(equipment_id=equipment_id).first()
    if not eq: raise HTTPException(404, "Equipment not found")
    return eq

@app.get("/api/equipment/{equipment_id}/telemetry")
def telemetry(equipment_id: str, hours: int = 24, db: Session = Depends(get_db)):
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    rows = db.query(SensorReading).filter(
        SensorReading.equipment_id == equipment_id,
        SensorReading.timestamp >= since
    ).order_by(SensorReading.timestamp).limit(2000).all()
    return rows

@app.get("/api/equipment/{equipment_id}/health")
def health_history(equipment_id: str, db: Session = Depends(get_db)):
    return db.query(HealthScore).filter_by(equipment_id=equipment_id).order_by(desc(HealthScore.timestamp)).limit(200).all()

@app.get("/api/equipment/{equipment_id}/alerts")
def equipment_alerts(equipment_id: str, db: Session = Depends(get_db)):
    return db.query(Alert).filter_by(equipment_id=equipment_id).order_by(desc(Alert.timestamp)).limit(100).all()

@app.get("/api/equipment/{equipment_id}/maintenance")
def maintenance(equipment_id: str, db: Session = Depends(get_db)):
    return db.query(MaintenanceRecord).filter_by(equipment_id=equipment_id).order_by(desc(MaintenanceRecord.date)).all()

@app.get("/api/alerts")
def alerts(db: Session = Depends(get_db)):
    return db.query(Alert).order_by(desc(Alert.timestamp)).limit(200).all()

@app.post("/api/alerts/{alert_id}/acknowledge")
def acknowledge(alert_id: int, db: Session = Depends(get_db)):
    alert = db.get(Alert, alert_id)
    if not alert: raise HTTPException(404, "Alert not found")
    alert.acknowledged = True
    db.commit()
    return {"ok": True}

@app.post("/api/alerts/{alert_id}/resolve")
def resolve(alert_id: int, db: Session = Depends(get_db)):
    alert = db.get(Alert, alert_id)
    if not alert: raise HTTPException(404, "Alert not found")
    alert.resolved = True
    db.commit()
    return {"ok": True}

@app.get("/api/analytics/overview")
def analytics(db: Session = Depends(get_db)):
    eqs = db.query(Equipment).all()
    def is_recent(ts):
        if not ts:
            return False
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - ts).total_seconds() < 120

    return {
        "total_equipment": len(eqs),
        "online_devices": sum(1 for e in eqs if is_recent(e.last_seen)),
        "average_health": round(sum(e.health_score for e in eqs)/len(eqs), 1) if eqs else 0,
        "critical": sum(1 for e in eqs if e.status == "CRITICAL"),
        "active_alerts": db.query(Alert).filter_by(resolved=False).count(),
        "anomalies": db.query(Alert).filter(Alert.sensor=="AI").count()
    }

@app.post("/api/demo/{equipment_id}")
async def demo(equipment_id: str):
    import asyncio, random
    base = {"temperature": 62, "vibration": 2.1, "current": 7.5, "voltage": 230, "pressure": 5.4, "rpm": 1450}
    for i in range(12):
        factor = i / 11
        t = Telemetry(
            device_id=f"DEMO-{equipment_id}", equipment_id=equipment_id,
            timestamp=datetime.now(timezone.utc),
            temperature=base["temperature"] + 35*factor + random.uniform(-1,1),
            vibration=base["vibration"] + 7*factor + random.uniform(-.15,.15),
            current=base["current"] + 12*factor,
            voltage=230 + random.uniform(-4,4),
            pressure=5.4,
            rpm=1450 - 600*factor,
            runtime_hours=3821 + i/60
        )
        payload = process_telemetry(t)
        await broadcast(payload)
        await asyncio.sleep(0.5)
    return {"ok": True, "message": "Degradation demo completed"}

@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    import jwt
    from .models import User
    from .security import verify_password
    user = db.query(User).filter_by(email=req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    token = jwt.encode({"sub": user.email, "role": user.role}, settings.jwt_secret, algorithm="HS256")
    return {"access_token": token, "token_type": "bearer", "role": user.role}

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await connect(ws)
    try:
        while True:
            await ws.receive_text()
    except Exception:
        disconnect(ws)
