# PowerShell Test Runner for ai-dropout-prediction
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " RUNNING ALL VERIFICATION TESTS: AI DROPOUT PREDICTION" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Backend Express Tests (Security, Auth, Validation, Chat Safety)
Write-Host "`n[1/2] Running Backend Jest Suite (Security & Chat Safety)..." -ForegroundColor Yellow
Push-Location -Path "backend"
try {
    npx jest --forceExit
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Backend tests failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
} finally {
    Pop-Location
}
Write-Host "[OK] Backend Jest suite passed successfully." -ForegroundColor Green

# 2. ML Service Pytest Suite (Inference, Parity, Leakage Prevention)
Write-Host "`n[2/2] Running ML Microservice Pytest Suite..." -ForegroundColor Yellow
Push-Location -Path "ml-service"
try {
    python -m pytest tests
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ML Microservice tests failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
} finally {
    Pop-Location
}
Write-Host "[OK] ML Microservice Pytest suite passed successfully." -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " ALL TEST SUITES PASSED CLEANLY (100% SUCCESS)!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
exit 0
