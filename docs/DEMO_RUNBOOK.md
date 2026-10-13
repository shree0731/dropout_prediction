# Demo Runbook: InSightERP + AI Dropout Prediction System

This runbook guides presenters and evaluators through the complete startup, verification, and end-to-end demonstration of the integrated Student Dropout Prediction & Intervention System.

---

## 1. System Architecture & Startup Order

The ecosystem consists of **5 distinct services** running concurrently:

```
[User / Browser]
       │
       ├──► http://localhost:5173 (ERP Frontend: Vite/React)
       │        └──► http://localhost:5000 (ERP Backend: Express/Mongo - student_dropout_erp)
       │                 └──► http://localhost:5001/api/predict (REST call with API Key)
       │
       └──► http://localhost:5174 (AI Standalone UI: Vite/React)
                └──► http://localhost:5001 (AI Backend Gateway: Express/Mongo - ai_dropout_prediction)
                         └──► http://localhost:8001 (ML Microservice: FastAPI/XGBoost)
```

### Strict Startup Order
Services **must** be launched in dependency order, waiting for each health endpoint before proceeding:
1. **Python FastAPI ML Microservice** (`port 8001`) — Loads XGBoost model & SHAP explainer
2. **AI Express Gateway Backend** (`port 5001`) — Verifies ML connectivity and database role (`APP_DB_ROLE=ai`)
3. **AI Standalone Frontend** (`port 5174`) — Vite development server
4. **ERP Express Backend** (`port 5000`) — Connects to ERP database (`APP_DB_ROLE=erp`)
5. **ERP React Frontend** (`port 5173`) — Vite development server

---

## 2. Launch Commands

### Automated Master Launcher
Run either of the master launcher scripts located in the root `Projects/` folder:

- **Windows (PowerShell)**:
  ```powershell
  .\start_demo.ps1
  ```
- **macOS / Linux (Bash)**:
  ```bash
  ./start_demo.sh
  ```

The launcher starts each service in order, polls each health endpoint until ready, and outputs the accessible URLs.

---

## 3. URLs & Ports Reference

| Service | Port | Endpoint URL | Health Check Endpoint |
|---|---|---|---|
| **Python ML Engine** | `8001` | `http://127.0.0.1:8001` | `http://127.0.0.1:8001/health` |
| **AI REST Gateway** | `5001` | `http://localhost:5001` | `http://localhost:5001/api/health` |
| **AI Standalone UI** | `5174` | `http://localhost:5174` | `http://localhost:5174` |
| **InSightERP Backend** | `5000` | `http://localhost:5000` | `http://localhost:5000/api/health` |
| **InSightERP Frontend** | `5173` | `http://localhost:5173` | `http://localhost:5173` |

---

## 4. Demo Accounts & Seeded Data

All demo accounts share the password configured in the `.env` file under `DEMO_PASSWORD`.

| Username | Role | Linked ID | Name | Dataset Profile / Context |
|---|---|---|---|---|
| `mentor` | Mentor | `FAC_MIST_IT_333` | Dr. Sudha Rajagopalan | IT Dept, 19 assigned mentees (8 High-Risk, 11 Low-Risk) |
| `student` | Student | `STU_MIST_IT_Y3_5559` | Bhoomika Gowda | **High Risk**: Attendance decayed 80.6% &rarr; 62.8%, 27 backlogs, CGPA 6.1 |
| `student2` | Student | `STU_MIST_IT_Y4_5573` | Vasanth Balasubramanian | **Medium Risk contrast**: Risk score 0.619, 80.8% attendance, 7 backlogs |
| `student3` | Student | `STU_MIST_IT_Y3_5514` | Sahana Hegde | **Low Risk contrast**: Risk score 0.184, 88.9% attendance, 0 backlogs |
| `admin` | Admin | `ADMIN_CHIEF_01` | Academic Dean Office | Institution-wide analytics across 4 campuses & 13 departments |

---

## 5. End-to-End Demo Click Path

### Phase 1: Standalone AI System Walkthrough (`http://localhost:5174`)

1. **Landing Page**:
   - Point out the headline layout, the verified metrics dynamically loaded from `/api/metrics`, and the "Simulated data" citations.
   - Scroll down to the architecture overview explaining integration into the prototype ERP.
2. **Model Evaluation Dashboard (`/model`)**:
   - Show dynamic model performance metrics (Macro F1, Class Precision/Recall).
   - Show the confusion matrix with verified class support counts: **1,502 Low**, **183 Medium**, and **155 High** test samples.
   - Note the data integrity summary: 9,200 total students and 352,753 marks records.
3. **Real-Time Prediction Page (`/predict`)**:
   - Choose demo student **Bhoomika Gowda** (`STU_MIST_IT_Y3_5559`).
   - Run live prediction: view probabilities, predicted risk label (`High`), and the SHAP feature importance plot showing top drivers (`attendance_decay`, `failed_subjects_count`).
4. **Academic Advisor Chatbot (`/chatbot`)**:
   - Note that Bhoomika Gowda's profile details are dynamically fetched from the database/CSV dataset.
   - Send an inquiry to show contextual, tone-adapted assistance.

---

### Phase 2: Live ERP Integration (`http://localhost:5173`)

1. **Mentor Intervention View**:
   - Log in as `mentor`.
   - On the Mentor Dashboard, observe the mentee roster: 19 mentees, with **8 High-Risk** students flagged.
   - Click on **Bhoomika Gowda** (`STU_MIST_IT_Y3_5559`) to open her dossier.
   - Observe the **Live AI Assessment** badge:
     - `Source: live`
     - `Prediction: High`
     - Probabilities and top risk drivers rendered directly from the AI microservice.
2. **Student Chatbot & Meeting Request**:
   - In a private/incognito window, navigate to `http://localhost:5173` and log in as `student`.
   - Open the floating chatbot widget at the bottom right.
   - Send the message:
     ```
     Can you please schedule a meeting with my faculty mentor to discuss my attendance and academic progress?
     ```
   - The chatbot detects the meeting request, creates an outbox entry in `ai_meeting_outbox`, relays it to the ERP ingestion endpoint, and replies:
     ```
     I've sent your request to your mentor (Dr. Sudha Rajagopalan).
     ```
3. **Mentor Inbox Verification**:
   - Switch back to the mentor window (`http://localhost:5173`).
   - Navigate to the **Meeting Requests** section (`/meetings`).
   - Confirm that the new request for **Bhoomika Gowda** is present in the list, categorized and prioritized for immediate action.

---

### Phase 3: Resilient Fallback Demonstration (Zero-Crash)

1. Open a terminal and terminate the AI Gateway Backend process (port 5001).
2. Return to the ERP frontend and refresh Bhoomika Gowda's student dossier.
3. **Result**: The ERP backend does not crash or throw an unhandled 500. Instead, it catches the network timeout and renders:
   - `Source: fallback`
   - Static risk label from database/dataset (`High`)
   - Notice: *"Live AI prediction service is unreachable or timed out"*.
4. Restart the AI Gateway backend (`npm start` in `ai-dropout-prediction/backend`); refresh the ERP page to confirm live prediction immediately resumes.

---

## 6. Automated Verification Check

Run the automated verification script:

```bash
# Full 4-step live integration verification
node scripts/demo_check.mjs

# Fallback resilience verification (when AI backend is stopped)
node scripts/demo_check.mjs --fallback
```

### Expected Output (Live Mode):
```
======================================================================
  AUTOMATED DEMO CHECK: FULL INTEGRATION VALIDATION
======================================================================

PASS: Step (a) - Demo mentor login succeeded (FAC_MIST_IT_333 / Dr. Sudha Rajagopalan)
PASS: Step (b) - Live risk assessment verified for STU_MIST_IT_Y3_5559 (source: 'live', prediction: 'High')
PASS: Step (c) - Meeting request chat message posted; assistant confirmed request sent to mentor
PASS: Step (d) - Meeting request for STU_MIST_IT_Y3_5559 successfully found in mentor inbox (status: pending)

======================================================================
  ALL DEMO CHECK STEPS PASSED SUCCESSFULLY (4/4)
======================================================================
```

---

## 7. Troubleshooting & Recovery

### 1. Port Conflict (`EADDRINUSE`)
If a port is already taken:
```powershell
# In PowerShell:
Get-NetTCPConnection -LocalPort 5000, 5001, 8001, 5173, 5174 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### 2. Database Role Mismatch
Ensure `.env` files contain the correct database marker:
- `FSD/backend/.env`: `APP_DB_ROLE=erp`
- `ai-dropout-prediction/backend/.env`: `APP_DB_ROLE=ai`

### 3. Re-seeding the Database
To re-initialize all demo accounts, mentees, and curriculum data:
```bash
cd FSD/backend
npm run seed
```
