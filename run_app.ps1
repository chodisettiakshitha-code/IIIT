# Collection Copilot 360 - One-Click PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting Collection Copilot 360 Application" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Write-Host "[1/2] Launching FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$workspace\backend'; python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[2/2] Launching Vite React Frontend on http://127.0.0.1:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$workspace\frontend'; npm run dev"

Write-Host "========================================================" -ForegroundColor Green
Write-Host " Application Launched Successfully!" -ForegroundColor Green
Write-Host " Frontend Web App: http://127.0.0.1:5173" -ForegroundColor Green
Write-Host " Interactive API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
