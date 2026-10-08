# PowerShell Startup Script for AI Dropout Prediction & Intervention Platform
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "  AI-POWERED STUDENT DROPOUT PREDICTION & INTERVENTION SYSTEM" -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "  1. Python FastAPI ML Engine  : http://127.0.0.1:8001" -ForegroundColor Green
Write-Host "  2. Node.js Express Gateway   : http://localhost:5001" -ForegroundColor Green
Write-Host "  3. React + Vite Frontend     : http://localhost:5174" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Python FastAPI ML Engine
Write-Host "[1/3] Launching FastAPI ML Engine on port 8001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\ml-service'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8001"

Start-Sleep -Seconds 3

# 2. Start Node.js Express Gateway
Write-Host "[2/3] Launching Node.js Express Gateway on port 5001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\backend'; npm start"

Start-Sleep -Seconds 3

# 3. Start Vite Frontend
Write-Host "[3/3] Launching Vite Frontend on port 5174..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\frontend'; npm run dev"

Start-Sleep -Seconds 4

Write-Host "Opening http://localhost:5174 in default browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5174"

Write-Host "All services started! Keep individual process windows open during testing." -ForegroundColor Green
