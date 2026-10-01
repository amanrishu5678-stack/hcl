$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host "=== INDUSENSE Local Setup ===" -ForegroundColor Cyan

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw "Python was not found. Install Python 3.10+ and reopen VS Code."
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "Node.js/npm was not found. Install Node.js 18+ and reopen VS Code."
}

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
}

$py = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
Write-Host "Installing Python packages..." -ForegroundColor Yellow
& $py -m pip install --upgrade pip
& $py -m pip install -r backend\requirements.txt
& $py -m pip install -r simulator\requirements.txt

if (-not (Test-Path "backend\app\ml_models\isolation_forest.joblib")) {
    Write-Host "Training Isolation Forest model..." -ForegroundColor Yellow
    & $py ml\train_model.py
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend packages..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
}

if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env"
}

Write-Host "Starting FastAPI backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$PSScriptRoot'; & '.\.venv\Scripts\python.exe' -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000"

Write-Host "Starting React frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$PSScriptRoot\frontend'; npm run dev"

Write-Host "" 
Write-Host "INDUSENSE is starting." -ForegroundColor Cyan
Write-Host "Dashboard: http://localhost:5173"
Write-Host "API:       http://localhost:8000"
Write-Host "Health:    http://localhost:8000/health"
Write-Host "Swagger:   http://localhost:8000/docs"
Write-Host "" 
Write-Host "Then run the simulator in another terminal:" -ForegroundColor Yellow
Write-Host ".\.venv\Scripts\Activate.ps1"
Write-Host "python simulator\simulator.py --equipment CNC-042 --mode normal"
