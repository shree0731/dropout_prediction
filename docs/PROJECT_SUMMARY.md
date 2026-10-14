# Project Architecture & Viva Defense Summary
## AI-Powered Student Dropout Prediction and Intervention System

### 1. Executive Summary & Core Deliverable
This standalone platform is an end-to-end, AI-powered system engineered to identify engineering undergraduates at risk of academic dropout and provide proactive, context-grounded counseling interventions.

- **Sibling Directory Architecture**: Resides in `ai-dropout-prediction/` alongside `FSD/` (the College ERP).
- **Core ML Model**: Gradient-Boosted Decision Trees (**XGBoost**) calibrated with cost-sensitive class weighting for high minority-class recall.
- **Explainability Engine**: SHAP (**SHapley Additive exPlanations**) TreeExplainer translating raw mathematical shapley values into plain-language actionable academic drivers (e.g., *"3 active uncleared backlogs"*, *"Attendance declined 17% over 6 months"*).
- **Intervention Dialogue Agent**: Context-aware advisor (*Baymate*) with institutional policy grounding, proactive check-ins, suicide/distress guardrails (Tele-MANAS integration), and automated faculty mentor meeting scheduling persisted into MongoDB.

---

### 2. Multi-Tier Microservice Topology

```
[ Browser Client / React Vite UI ] (Port 5174)
               |
          REST Calls (/api)
               v
[ Public Gateway / Node.js Express ] (Port 5001) <---> [ MongoDB Atlas Cloud ]
               |                                       - student_dropout_erp
         Internal Hop                                  - MeetingRequest records
               v
[ ML Microservice / Python FastAPI ] (Port 8001)
   ├── XGBoost Pipeline (dropout_model.pkl)
   ├── SHAP TreeExplainer Attribution
   └── Baymate Intervention Engine (Gemini 2.5 Flash + Rule-Based Guardrails)
```

1. **Frontend (React 18 + Vite)** on `http://localhost:5174`:
   - Modern dark UI with glassmorphic styling, pink accents (`#ED4D8B`), and clean tabular views.
   - **Model Evaluation Dashboard**: Real-time confusion matrix heatmap, SHAP global feature importance ranking, and baseline tournament comparison.
   - **Predict Risk Sandbox**: 1-click test selector with 30 pre-loaded balanced demo students (High, Medium, Low risk) + manual custom parameter input.
   - **Baymate Chat Advisor**: Real-time dialogue interface showing active student academic badges, quick prompt chips, and instant meeting escalation confirmations.
2. **Gateway Backend (Node.js + Express 4.x)** on `http://localhost:5001`:
   - Acts as the unified public API for both the standalone UI and future College ERP requests.
   - Handles `X-API-Key` authentication and CORS.
   - Persists meeting requests initiated by the chatbot into MongoDB Atlas `MeetingRequest` collection.
   - Features built-in resilient fallbacks so the system never fails even during microservice cold starts.
3. **ML Microservice (Python 3.14 + FastAPI + Uvicorn)** on `http://localhost:8001`:
   - Hosted privately and reachable only via loopback from the Express gateway.
   - Runs model inference, extracts SHAP drivers, checks crisis queries, and provides empathetic counseling dialogue.

---

### 3. Machine Learning Technical Highlights

| Metric | Result | Viva Justification |
|---|---|---|
| **Dataset Size** | 9,200 students, 352,753 marks | Realistic engineering cohort across 13 branches and 4 institutions. |
| **Class Distribution** | 81.65% Low, 9.92% Med, 8.42% High | Matches empirical Indian autonomous college dropout distributions. |
| **Selected Model** | **XGBoost Classifier** | Outperformed Logistic Regression and Random Forest on Macro F1. |
| **Overall Accuracy** | **96.58%** | Stratified test split across all 3 classes. |
| **Macro F1-Score** | **0.9370** | Proves performance across minority classes, not just the majority. |
| **High Risk Recall** | **99.35%** | Crucial metric: almost zero false negatives for severely endangered students. |
| **Medium Risk Recall** | **89.07%** | Detects early warning signs before students deteriorate to High Risk. |
| **Explainability** | **SHAP TreeExplainer** | Mathematically rigorous local feature attribution translated to plain text. |

---

### 4. Key Defense / Viva Questions & Answers

#### Q1: Why did you use Macro F1 instead of overall accuracy?
> *"Because the dataset is imbalanced (81.65% Low, 9.92% Medium, 8.42% High). A trivial dummy classifier predicting 'Low' for every student would score 81.65% accuracy while failing to identify a single high-risk student. Macro F1 calculates the unweighted mean of F1 scores across all three classes, giving equal importance to minority classes and ensuring high recall on High and Medium risk students."*

#### Q2: Why did you pick Class-Weighting over SMOTE?
> *"In our empirical benchmark on the 9,200 student dataset, synthetic oversampling (SMOTE) generated artificial boundary points in feature space that marginally distorted probability calibrations. Balanced class-weighted loss achieved equivalent High-Risk recall (99.35%) and superior macro F1 (0.9370) on the actual feature distributions without synthetic artifacts."*

#### Q3: Why separate the Python ML service from Express instead of running everything in Python?
> *"This mirrors enterprise microservice patterns and maintains architectural consistency with our College ERP system (built on the MERN stack). Express manages client-facing concerns like CORS, authentication headers, rate limits, and MongoDB document persistence, while FastAPI is dedicated strictly to compute-heavy ML inferences and LLM dialogue."*

#### Q4: How does the system protect against AI hallucination in the chatbot?
> *"Baymate is strictly conditioned on verified academic records passed in the student context banner (attendance, backlogs, GPA, mentor). It is instructed never to fabricate marks or eligibility rules. Furthermore, if the LLM service is offline, a deterministic, rule-based fallback advisor steps in to deliver exact institutional regulations (75% attendance cutoff, remedial tutorials, and 24x7 Tele-MANAS helpline for crisis queries)."*

---

### 5. How to Run the Project
- **One-Click Launcher (Windows)**: Double-click `start_all.bat`.
- **PowerShell Launcher**: Run `.\start_services.ps1`.
- **Manual Launch**:
  1. Terminal 1: `cd ml-service && python -m uvicorn app.main:app --port 8001`
  2. Terminal 2: `cd backend && npm start`
  3. Terminal 3: `cd frontend && npm run dev`
  4. Open browser at `http://localhost:5174`.
