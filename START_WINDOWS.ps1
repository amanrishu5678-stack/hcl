$ErrorActionPreference = 'Stop'
Write-Host "INDUSENSE AI - Industrial Equipment Health Platform" -ForegroundColor Cyan
Write-Host ""
Write-Host "Checking Docker..." -ForegroundColor Yellow
try { docker version | Out-Null } catch {
  Write-Host "Docker is not available. Start Docker Desktop, wait until the engine is running, then run this script again." -ForegroundColor Red
  exit 1
}
Write-Host "Docker is ready." -ForegroundColor Green
Write-Host "Starting INDUSENSE services..." -ForegroundColor Yellow
docker compose up --build
