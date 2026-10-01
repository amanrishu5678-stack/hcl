# INDUSENSE — VS Code + Copilot Quick Start

This version is designed to run **without Docker, PostgreSQL, or Mosquitto**.
It uses **SQLite + FastAPI + React/Vite + HTTP telemetry** by default. MQTT support remains optional.

## Requirements
- Windows 10/11
- Python 3.10+
- Node.js 18+
- VS Code
- GitHub Copilot is optional but recommended for development assistance

## 1. Open the project
Open this folder in VS Code:

`INDUSENSE_AI`

The repository includes `.github/copilot-instructions.md`, so Copilot has project-specific guidance.

## 2. One-command setup
Open a PowerShell terminal in the project root:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\RUN_LOCAL.ps1
```

The script creates `.venv`, installs Python dependencies, installs frontend dependencies, trains the Isolation Forest if needed, and opens the backend/frontend in separate PowerShell windows.

## 3. Open the dashboard

Frontend: http://localhost:5173

API: http://localhost:8000

Health check: http://localhost:8000/health

Swagger: http://localhost:8000/docs

Demo login:
- `admin@indusense.local` / `Admin@123`
- `engineer@indusense.local` / `Engineer@123`

## 4. Run the simulator
Open a new terminal:

```powershell
.\.venv\Scripts\Activate.ps1
python simulator\simulator.py --equipment CNC-042 --mode normal
```

Try anomaly modes:

```powershell
python simulator\simulator.py --equipment CNC-042 --mode vibration_anomaly
python simulator\simulator.py --equipment CNC-042 --mode overheating
python simulator\simulator.py --equipment CNC-042 --mode current_anomaly
python simulator\simulator.py --equipment CNC-042 --mode critical
```

The simulator defaults to HTTP and posts to the FastAPI backend. No broker is required.

## 5. Useful VS Code tasks
Open **Terminal → Run Task** and choose:
- INDUSENSE: Backend
- INDUSENSE: Frontend
- INDUSENSE: Simulator Normal
- INDUSENSE: Simulator Vibration
- INDUSENSE: Test Backend

## 6. Optional MQTT mode
Install:

```powershell
pip install paho-mqtt
```

Then run a Mosquitto broker yourself and set `MQTT_ENABLED=true` in `.env`; the backend can subscribe to `industrial/+/telemetry`. This is optional for the college demo.

## 7. Stop the local app
Close the backend/frontend PowerShell windows, or use `STOP_LOCAL.ps1` if processes were started by the setup script.
