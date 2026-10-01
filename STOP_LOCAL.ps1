Write-Host "Stopping local INDUSENSE processes..." -ForegroundColor Yellow
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'uvicorn backend.app.main:app' -or $_.CommandLine -match 'vite --host' } | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}
Write-Host "Stopped." -ForegroundColor Green
