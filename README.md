# INDUSENSE AI — Industrial Equipment Health Scoring

A professional Embedded IoT + AI predictive-maintenance demonstration that runs locally in **VS Code on Windows without Docker**.

## Default local architecture

`Python Simulator / ESP32 → HTTP telemetry → FastAPI → SQLite → AI → Health Score → Alerts → WebSocket → React Dashboard`

MQTT + Mosquitto and PostgreSQL remain optional deployment paths.

## Features

- Industrial dark React dashboard
- 0–100 explainable equipment health score
- Temperature, vibration, current, voltage, RPM and pressure telemetry
- Isolation Forest anomaly detection with deterministic fallback
- Alert generation, acknowledgement and resolution
- Historical telemetry and health data
- WebSocket live updates
- SQLite persistence for zero-setup local development
- Python simulator with normal/anomaly/critical/offline modes
- Optional MQTT transport
- ESP32 firmware scaffold
- FastAPI Swagger docs
- VS Code tasks
- GitHub Copilot instructions

## Run in VS Code

1. Open the `INDUSENSE_AI` folder in VS Code.
2. Open PowerShell.
3. Run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\RUN_LOCAL.ps1
```

4. Open http://localhost:5173
5. Login with `admin@indusense.local` / `Admin@123`.
6. In another terminal:

```powershell
.\.venv\Scripts\Activate.ps1
python simulator\simulator.py --equipment CNC-042 --mode normal
```

Try:

```powershell
python simulator\simulator.py --equipment CNC-042 --mode vibration_anomaly
python simulator\simulator.py --equipment CNC-042 --mode overheating
python simulator\simulator.py --equipment CNC-042 --mode current_anomaly
python simulator\simulator.py --equipment CNC-042 --mode critical
```

## Endpoints

- Dashboard: http://localhost:5173
- API: http://localhost:8000
- Health: http://localhost:8000/health
- Swagger: http://localhost:8000/docs

## Copilot

See `.github/copilot-instructions.md`. Copilot should preserve the current architecture and use HTTP + SQLite for local work unless you explicitly request MQTT/PostgreSQL.

## AI model

The included Isolation Forest is trained on synthetic normal operating data. It is a demonstration model, not a production-certified predictive-maintenance model. Real industrial deployment requires real machine data, calibration and validation.

## Optional Docker/MQTT/PostgreSQL

`docker-compose.yml` and the ESP32/MQTT materials remain in the repository as an optional deployment path. They are not required for the normal VS Code demo.
