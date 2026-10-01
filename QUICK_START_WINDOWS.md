# INDUSENSE - Windows Quick Start

1. Start **Docker Desktop** and wait until the Docker Engine is running.
2. Open PowerShell in this folder.
3. Run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\START_WINDOWS.ps1
```

4. Open **http://localhost:5173**.
5. API health: **http://localhost:8000/health**
6. Swagger: **http://localhost:8000/docs**

Demo login:

- `admin@indusense.local` / `Admin@123`
- `engineer@indusense.local` / `Engineer@123`

### Live telemetry demo

Open another PowerShell window:

```powershell
cd simulator
python -m pip install -r requirements.txt
python simulator.py --equipment CNC-042 --mode normal
```

Then try:

```powershell
python simulator.py --equipment CNC-042 --mode vibration_anomaly
python simulator.py --equipment CNC-042 --mode overheating
python simulator.py --equipment CNC-042 --mode current_anomaly
python simulator.py --equipment CNC-042 --mode critical
```

Stop all Docker services with:

```powershell
.\STOP_WINDOWS.ps1
```

If `/health` returns `Not Found`, you are not running the INDUSENSE backend from this package. Stop the other backend process/container and start this project's Docker Compose stack.
