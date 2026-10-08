@echo off
TITLE AI-Powered Student Dropout Prediction and Intervention System Launcher
COLOR 0B

echo ===============================================================================
echo   AI-POWERED STUDENT DROPOUT PREDICTION & INTERVENTION SYSTEM
echo ===============================================================================
echo   Starting 3 Microservices:
echo   1. ML Engine (Python FastAPI)      : http://127.0.0.1:8001
echo   2. Public Gateway (Node.js/Express): http://localhost:5001
echo   3. Standalone UI (React / Vite)    : http://localhost:5174
echo ===============================================================================
echo.

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo [1/3] Starting Python FastAPI ML Engine on port 8001...
start "AI Dropout - FastAPI ML Engine [Port 8001]" cmd /k "cd /d "%SCRIPT_DIR%ml-service" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8001"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Node.js Express Gateway on port 5001...
start "AI Dropout - Express API Gateway [Port 5001]" cmd /k "cd /d "%SCRIPT_DIR%backend" && npm start"

timeout /t 3 /nobreak >nul

echo [3/3] Starting React + Vite Standalone Frontend on port 5174...
start "AI Dropout - Vite Frontend [Port 5174]" cmd /k "cd /d "%SCRIPT_DIR%frontend" && npm run dev"

timeout /t 4 /nobreak >nul

echo.
echo All microservices have been launched in dedicated terminal windows!
echo Opening browser at http://localhost:5174 ...
start http://localhost:5174

echo ===============================================================================
echo   System is live and running!
echo   Keep the terminal windows open while testing or demonstrating.
echo ===============================================================================
pause
