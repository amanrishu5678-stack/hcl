import argparse
import json
import random
import time
from datetime import datetime, timezone

import requests

try:
    import paho.mqtt.client as mqtt
except ImportError:
    mqtt = None

parser = argparse.ArgumentParser(description="INDUSENSE industrial telemetry simulator")
parser.add_argument("--equipment", default="CNC-042")
parser.add_argument("--mode", choices=["normal", "overheating", "vibration_anomaly", "current_anomaly", "critical", "offline"], default="normal")
parser.add_argument("--transport", choices=["http", "mqtt"], default="http")
parser.add_argument("--api", default="http://127.0.0.1:8000/api/telemetry")
parser.add_argument("--host", default="127.0.0.1")
parser.add_argument("--port", type=int, default=1883)
parser.add_argument("--interval", type=float, default=2.0)
parser.add_argument("--duration", type=int, default=0, help="Seconds; 0 means continuous")
args = parser.parse_args()

if args.transport == "mqtt" and mqtt is None:
    raise SystemExit("MQTT mode requires paho-mqtt. Install simulator requirements or use the default HTTP mode.")

mqtt_client = None
if args.transport == "mqtt":
    mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    mqtt_client.connect(args.host, args.port, 60)
    mqtt_client.loop_start()

start = time.time()
i = 0
print(f"INDUSENSE simulator: {args.equipment} / {args.mode} / {args.transport}")
print("Press Ctrl+C to stop.")

while args.duration == 0 or time.time() - start < args.duration:
    i += 1
    f = min(1.0, i / 60)
    temp, vib, cur, volt, pressure, rpm = 62, 2.1, 7.5, 230, 5.4, 1450

    if args.mode == "overheating":
        temp += 38 * f
    elif args.mode == "vibration_anomaly":
        vib += 8 * f
        temp += 15 * f
    elif args.mode == "current_anomaly":
        cur += 15 * f
        temp += 10 * f
    elif args.mode == "critical":
        temp += 42 * f
        vib += 12 * f
        cur += 20 * f
        rpm -= 700 * f
    elif args.mode == "offline":
        print("Offline mode: telemetry intentionally stopped.")
        time.sleep(args.interval)
        continue

    payload = {
        "device_id": f"ESP32-{args.equipment}",
        "equipment_id": args.equipment,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "temperature": round(temp + random.uniform(-1, 1), 2),
        "vibration": round(max(0, vib + random.uniform(-0.15, 0.15)), 2),
        "current": round(max(0, cur + random.uniform(-0.5, 0.5)), 2),
        "voltage": round(volt + random.uniform(-3, 3), 2),
        "pressure": round(pressure + random.uniform(-0.15, 0.15), 2),
        "rpm": round(max(0, rpm + random.uniform(-30, 30)), 1),
        "runtime_hours": 3821 + i / 1800,
    }

    try:
        if args.transport == "http":
            response = requests.post(args.api, json=payload, timeout=5)
            response.raise_for_status()
            result = response.json()
        else:
            mqtt_client.publish(f"industrial/{args.equipment}/telemetry", json.dumps(payload), qos=1)
            result = {"transport": "mqtt"}
        print(json.dumps({"telemetry": payload, "result": result}, default=str))
    except requests.RequestException as exc:
        print(f"HTTP delivery failed: {exc}")
    time.sleep(args.interval)

if mqtt_client:
    mqtt_client.loop_stop()
    mqtt_client.disconnect()
