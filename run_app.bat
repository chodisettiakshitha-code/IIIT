@echo off
echo ========================================================
echo Starting Collection Copilot 360 Application
echo ========================================================

echo [1/3] Checking environment...
cd /d %~dp0

echo [2/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Collection Copilot Backend" cmd /k "cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Vite React Frontend on http://127.0.0.1:5173 ...
start "Collection Copilot Frontend" cmd /k "cd frontend && npm run dev"

echo ========================================================
echo Collection Copilot 360 is running!
echo Access the Web App at: http://127.0.0.1:5173
echo API Swagger Docs at:   http://127.0.0.1:8000/docs
echo ========================================================
