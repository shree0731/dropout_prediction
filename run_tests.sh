#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " RUNNING ALL VERIFICATION TESTS: AI DROPOUT PREDICTION"
echo "=========================================================="

echo -e "\n[1/2] Running Backend Jest Suite (Security & Chat Safety)..."
cd backend
npx jest --forceExit
cd ..
echo "[OK] Backend Jest suite passed successfully."

echo -e "\n[2/2] Running ML Microservice Pytest Suite..."
cd ml-service
python -m pytest tests
cd ..
echo "[OK] ML Microservice Pytest suite passed successfully."

echo -e "\n=========================================================="
echo " ALL TEST SUITES PASSED CLEANLY (100% SUCCESS)!"
echo "=========================================================="
exit 0
