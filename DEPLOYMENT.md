# AI Dropout Prediction Microservice & Gateway — Deployment Guide

This guide details the deployment, containerization, environment variables, model verification, and inter-service connectivity for the **AI Dropout Prediction Microservice & AI Copilot Gateway**.

---

## 1. Services in this Repository

| Component | Directory | Technology | Default Port | Production Role |
| :--- | :--- | :--- | :--- | :--- |
| **ML Microservice** | `ml-service/` | Python 3.12 / FastAPI / Uvicorn | 8001 | XGBoost Classifier, Scikit-learn preprocessing pipeline, SHAP TreeExplainer calculations. |
| **AI Prediction Gateway** | `backend/` | Node.js / Express / Helmet | 5001 | API Gateway, Session Token generation, rate limiting, and chat dialog proxying. |
| **AI Advisor Frontend** | `frontend/` | React 18 / Vite / Tailwind | 5174 | Prospective student risk evaluation interface and Baymate conversational copilot. |

---

## 2. Environment Variables Specification

### AI Prediction Gateway (`backend/.env`)

| Variable Name | Required | Example | Purpose |
| :--- | :--- | :--- | :--- |
| `PORT` | Yes | `5001` | Express server port. |
| `NODE_ENV` | Yes | `production` or `development` | Operating mode. In `production`, secret lengths (32+ chars) and origins are strictly enforced. |
| `API_KEY` | Yes (in prod) | `sec_f84b1e92d7c04a3e819a6d4e2c71095b` | 32+ character key required in `X-API-Key` headers for server-to-server calls from the ERP backend. |
| `SESSION_TOKEN_SECRET`| Yes | `crypto.randomBytes(32).toString('hex')` | HMAC secret for signing short-lived sandbox session tokens issued to prospective students. |
| `CORS_ORIGINS` | Yes | `http://localhost:5173,http://localhost:5174,http://localhost:5000` | Authorized origins. Wildcard `*` rejected in production. |
| `TRUST_PROXY` | Yes | `1` | Express `trust proxy` setting for reverse proxy deployments. |
| `ML_SERVICE_URL` | Yes | `http://127.0.0.1:8001` | Base URL of the Python FastAPI XGBoost microservice. |
| `ERP_SERVICE_BASE_URL`| Yes | `http://localhost:5000` | Base URL of the Institutional College ERP for dispatching meeting requests. |
| `ERP_SERVICE_API_KEY` | Yes | `erp_srv_9c18d4e7f603a152b820e981c472d03a` | Shared key sent to ERP `/api/integrations/meeting-requests`. |
| `GEMINI_API_KEY` | No | `AIzaSy...` | Optional API key for generative explanations. Falls back gracefully to heuristic academic advisory. |

### ML Microservice (`ml-service/`)

| Variable Name | Required | Example | Purpose |
| :--- | :--- | :--- | :--- |
| `PORT` | No | `8001` | Port for Uvicorn server (used in Dockerfile). |
| `MODEL_PATH` | No | `models/dropout_model_latest.pkl` | Path to serialized XGBoost model file. |
| `METADATA_PATH` | No | `models/model_metadata.json` | Path to training metrics, feature importance, and performance evaluation metrics. |

---

## 3. Local Startup Instructions

### ML Microservice (Terminal 1)
```powershell
cd ml-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```
On startup, the service prints:
```
[ML Service Startup] Python environment: 3.14 / 3.12
[ML Service Startup] Scikit-Learn: 1.8.0 | XGBoost: 3.4.1 | SHAP: 0.52.0
[ML Service Startup] Successfully loaded model from models/dropout_model_latest.pkl
```

### AI Prediction Gateway (Terminal 2)
```powershell
cd backend
npm install
npm start
```

### AI Advisor Frontend (Terminal 3)
```powershell
cd frontend
npm install
npm run dev
```

---

## 4. Docker Deployment for ML Microservice

A production-ready `Dockerfile` and `.dockerignore` are provided in `ml-service/`.

### Build Docker Image
```bash
cd ml-service
docker build -t ai-dropout-ml-service:1.0 .
```

### Run Container
```bash
docker run -d -p 8001:8001 --name ml-service -e PORT=8001 ai-dropout-ml-service:1.0
```

### Verify Container Health
```bash
curl http://localhost:8001/health
# Response: {"status":"ok","service":"ml_dropout_prediction","model_loaded":true}
```

---

## 5. Health Check Reference

- **ML Service Liveness**: `GET http://127.0.0.1:8001/health` (No auth)
- **AI Gateway Liveness**: `GET http://localhost:5001/health` (No auth)
- **Deep ERP Diagnostic**: `GET http://localhost:5000/api/health/deep` (No auth, checks MongoDB, AI Gateway, ML Service, and SMTP status in parallel).
