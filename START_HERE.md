# START HERE

You do **not** need Docker for this version.

### 1. Install once

Install:
- Python 3.10+
- Node.js 18+
- VS Code

### 2. Open this folder in VS Code

Open the `INDUSENSE_AI` folder.

### 3. Run

PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\RUN_LOCAL.ps1
```

### 4. Open

http://localhost:5173

Login:

`admin@indusense.local`

`Admin@123`

### 5. Run telemetry

New terminal:

```powershell
.\.venv\Scripts\Activate.ps1
python simulator\simulator.py --equipment CNC-042 --mode normal
```

Then try:

```powershell
python simulator\simulator.py --equipment CNC-042 --mode vibration_anomaly
```

The dashboard should update the machine's health and alerts.

### 6. API checks

- http://localhost:8000/health
- http://localhost:8000/docs

### 7. Copilot

See `COPILOT_PROMPT.md` and `.github/copilot-instructions.md`.
