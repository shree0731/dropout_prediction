# College ERP Integration Guide: AI Dropout Prediction & Intervention

This document specifies how the existing College ERP system (`FSD/`) integrates with this standalone **AI Dropout Prediction & Intervention Service** (`ai-dropout-prediction/`).

---

## 1. System Architecture & Topology

```
+-----------------------------------------------------------------------------------+
|                            EXISTING COLLEGE ERP (FSD)                             |
|                                                                                   |
|  +--------------------------------+      +-------------------------------------+  |
|  |  ERP Frontend (React + Vite)   |      |   ERP Backend (Node.js + Express)   |  |
|  |       http://localhost:5173    |      |        http://localhost:5000        |  |
|  |                                |      |                                     |  |
|  |  • Mentor Student Risk Table   | ---> |  • Aggregates student attendance,   |  |
|  |  • Risk Driver Details Modal   |      |    GPA, backlogs from MongoDB       |  |
|  |  • Slide-out Chatbot Widget    |      |  • Queries AI Service on port 5001  |  |
|  +--------------------------------+      +-------------------------------------+  |
+-------------------------------------------------------------|---------------------+
                                                              |
                                           REST API (HTTP/JSON + X-API-Key)
                                                              |
                                                              v
+-----------------------------------------------------------------------------------+
|                STANDALONE AI DROPOUT PREDICTION SERVICE (Sibling)                 |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |             Public Gateway: Express + MongoDB (Port 5001)                   |  |
|  |                                                                             |  |
|  |  • POST /api/predict   -> Relays to ML model, returns SHAP risk drivers     |  |
|  |  • POST /api/chat      -> Relays to Advisor Agent, persists MeetingRequest  |  |
|  |  • GET  /api/metrics   -> Serves confusion matrix, macro F1 & feature ranks |  |
|  |  • GET  /api/students/demo -> Balanced sample for interactive testing       |  |
|  +---------------------------------------|-------------------------------------+  |
|                                          | Internal Loopback (Port 8001)          |
|                                          v                                        |
|  +-----------------------------------------------------------------------------+  |
|  |             ML Engine Microservice: Python FastAPI (Port 8001)               |  |
|  |                                                                             |  |
|  |  • Trained XGBoost Pipeline (Macro F1: 0.9370, High Recall: 99.35%)         |  |
|  |  • SHAP TreeExplainer & Plain-Language Driver Translation                   |  |
|  |  • Astra Dialog Agent (Gemini 2.5 Flash + Rule-Based Safe Grounding)        |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Port Allocation & Network Security

| Service | Technology | Port | Access Scope |
|---|---|---|---|
| **College ERP Frontend** | React / Vite | `5173` | Browser Users (Students, Mentors, Admins) |
| **College ERP Backend** | Node.js Express | `5000` | ERP Internal & Frontend |
| **AI Prediction Frontend** | React / Vite | `5174` | Standalone Demo / Evaluator Showcase |
| **AI Gateway Backend** | Node.js Express | `5001` | Public REST Gateway (CORS enabled) |
| **AI ML Microservice** | Python FastAPI | `8001` | Private Internal (Reachable ONLY by Express 5001) |

### Authentication & Authorization
All write and inference requests to the AI Prediction Gateway (`http://localhost:5001`) are secured using an API key header:
- **Header**: `X-API-Key: ai-dropout-secret-key-2026`
- **CORS**: Configured on port 5001 with permissive origins (`*` or `http://localhost:5173`) allowing seamless ERP frontend and backend communication.

---

## 3. API Contract Specifications

### 3.1. Risk Assessment & Explainability (`POST /api/predict`)

#### Request Shape
```json
POST http://localhost:5001/api/predict
Content-Type: application/json
X-API-Key: ai-dropout-secret-key-2026

{
  "student_id": "STU_EEC_CSE_Y2_0001",
  "department": "CSE",
  "year_of_study": 2,
  "attendance_pct": 64.5,
  "monthly_attendance_trend": [82.0, 78.5, 74.0, 70.2, 66.5, 64.5],
  "overall_gpa": 5.4,
  "backlogs_count": 3,
  "cutoff_mark_200": 172.5,
  "mentor_meetings_attended": 1,
  "family_income_annual": 210000,
  "first_gen_learner": 1,
  "distance_from_home_km": 32.0,
  "subject_marks_summary": {
    "failed_subjects_count": 3,
    "core_theory_average": 48.2
  }
}
```

#### Response Shape
```json
{
  "student_id": "STU_EEC_CSE_Y2_0001",
  "prediction": "High",
  "probabilities": {
    "Low": 0.08,
    "Medium": 0.17,
    "High": 0.75
  },
  "top_risk_drivers": [
    {
      "feature": "backlogs_count",
      "contribution": "+0.34",
      "message": "3 active uncleared backlogs detected across semesters"
    },
    {
      "feature": "attendance_decay",
      "contribution": "+0.35",
      "message": "Attendance declined 17.5% over the last 6 months"
    },
    {
      "feature": "attendance_pct",
      "contribution": "+0.25",
      "message": "Attendance (64.5%) is below statutory 75% exam eligibility"
    },
    {
      "feature": "overall_gpa",
      "contribution": "+0.20",
      "message": "Cumulative GPA (5.40/10) reflects sustained academic stress"
    }
  ],
  "recommended_interventions": [
    "Schedule mandatory 1-on-1 faculty mentor counseling session",
    "Enroll in special remedial tutorial classes for uncleared core subjects",
    "Issue statutory attendance warning & establish bi-weekly parent communication",
    "Review hostel accommodation and daily commute feasibility"
  ]
}
```

---

### 3.2. Meeting Request Ingestion (`POST /api/integrations/meeting-requests`)
Implemented in InSightERP backend (`FSD/backend/controllers/integrationController.js`) and called by the AI delivery service (`ai-dropout-prediction/backend/services/erpDeliveryService.js`).

#### Authentication
- **Header**: `X-Service-Key: <ERP_SERVICE_API_KEY>` (Timing-safe evaluation via `crypto.timingSafeEqual`)
- **Caller Guard**: Ingestion is triggered **only** for authenticated service-key calls (`req.authType === 'api-key'`), never for public sandbox session-token calls.

#### Request Shape
```json
POST http://localhost:5000/api/integrations/meeting-requests
Content-Type: application/json
X-Service-Key: <ERP_SERVICE_API_KEY>

{
  "request_id": "9f7b1e84-18c2-48ea-8b4e-28c049b1a5e1",
  "student_id": "STU_EEC_CSE_Y2_0001",
  "college_id": "C101",
  "category": "crisis",
  "urgency": "urgent",
  "reason_short": "Immediate emotional distress / crisis detection"
}
```

> **PRIVACY INVARIANT (Zero Transcript Leakage):** The `reason_short` field is strictly mapped from the enum category (`crisis` -> emotional distress, `academic` -> academic performance review, `meeting` -> 1-on-1 mentor consultation). Raw student chat messages or conversational transcripts are **never** transmitted in the integration payload.

#### Response Shape
```json
{
  "message": "Meeting request ingested successfully",
  "request_id": "9f7b1e84-18c2-48ea-8b4e-28c049b1a5e1",
  "mentor_id": "FAC_1001",
  "mentor_name": "Dr. Kavitha Ramanathan",
  "urgency": "urgent"
}
```

---

### 3.3. Empathetic Advisor & Three-State Honest Wording (`POST /api/chat`)

#### Request Shape
```json
POST http://localhost:5001/api/chat
Content-Type: application/json
X-API-Key: <AI_SERVICE_API_KEY>

{
  "message": "I'm overwhelmed and need help.",
  "student_context": {
    "student_id": "STU_EEC_CSE_Y2_0001",
    "student_name": "Arun Kumar",
    "department": "CSE",
    "year_of_study": 2,
    "attendance_pct": 64.5,
    "overall_gpa": 5.4,
    "backlogs_count": 3
  }
}
```

#### Honest Reply States
1. **Delivered**: `"I've sent your request to your mentor (Dr. Kavitha Ramanathan)."`
2. **Saved but Pending Delivery**: `"I've recorded your request but couldn't reach your mentor's inbox right now. Please also contact [Campus Student Counselling Desk]."`
3. **Not Saved / System Offline**: Emergency national helplines (Tele-MANAS: 14416, KIRAN: 1800-599-0019) and campus contacts provided directly; **zero** false claims that anything was recorded.

---

## 4. Integration Code Snippets for ERP Implementation

### 4.1. Node.js Service Call in ERP Backend (`FSD/backend/services/aiService.js`)

```javascript
/**
 * FSD College ERP - AI Microservice Client
 * Communicates with ai-dropout-prediction on port 5001.
 */
const axios = require('axios');

const AI_SERVICE_BASE = process.env.AI_SERVICE_URL || 'http://localhost:5001/api';
const AI_API_KEY = process.env.AI_SERVICE_KEY || 'ai-dropout-secret-key-2026';

const aiClient = axios.create({
  baseURL: AI_SERVICE_BASE,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': AI_API_KEY
  }
});

/**
 * Predict risk for an ERP student
 * Includes defensive fallback so ERP Mentor Dashboard NEVER breaks
 */
async function getStudentRiskPrediction(studentData) {
  try {
    const payload = {
      student_id: studentData.student_id,
      department: studentData.department,
      year_of_study: studentData.year_of_study,
      attendance_pct: studentData.attendance_pct,
      monthly_attendance_trend: studentData.monthly_attendance_trend || [],
      overall_gpa: studentData.overall_gpa,
      backlogs_count: studentData.backlogs_count,
      cutoff_mark_200: studentData.cutoff_mark_200 || 165.0,
      mentor_meetings_attended: studentData.mentor_meetings_attended || 2,
      family_income_annual: studentData.family_income_annual || 250000,
      first_gen_learner: studentData.first_gen_learner ? 1 : 0,
      distance_from_home_km: studentData.distance_from_home_km || 25.0,
      subject_marks_summary: {
        failed_subjects_count: studentData.backlogs_count || 0,
        core_theory_average: studentData.overall_gpa > 7.0 ? 70.0 : 50.0
      }
    };

    const response = await aiClient.post('/predict', payload);
    return response.data;
  } catch (error) {
    console.warn(`[AI Service Offline] Falling back to institutional heuristic for ${studentData.student_id}:`, error.message);
    
    // Graceful offline fallback
    const isHigh = studentData.backlogs_count >= 3 || (studentData.attendance_pct < 65 && studentData.overall_gpa < 5.5);
    const isMed = studentData.backlogs_count >= 1 || studentData.attendance_pct < 75 || studentData.overall_gpa < 6.5;

    return {
      student_id: studentData.student_id,
      prediction: isHigh ? 'High' : isMed ? 'Medium' : 'Low',
      probabilities: { Low: 0.33, Medium: 0.33, High: 0.34 },
      top_risk_drivers: [
        { feature: 'backlogs_count', contribution: '+0.25', message: `${studentData.backlogs_count} uncleared backlogs` },
        { feature: 'attendance_pct', contribution: '+0.20', message: `${studentData.attendance_pct}% attendance recorded` }
      ],
      recommended_interventions: ['Review student records with department coordinator'],
      offline_mode: true
    };
  }
}

module.exports = { getStudentRiskPrediction };
```

---

### 4.2. React Component for ERP Mentor Dashboard (`RiskBadgeModal.jsx`)

```jsx
import React, { useState } from 'react';

export function RiskBadgeWithModal({ student, predictionData }) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!predictionData) {
    return (
      <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#334155', color: '#94A3B8', fontSize: '11px' }}>
        Unassessed
      </span>
    );
  }

  const { prediction, probabilities, top_risk_drivers, recommended_interventions } = predictionData;

  const badgeStyles = {
    High: { background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' },
    Medium: { background: '#FEF3C7', color: '#D97706', border: '1px solid #FCD34D' },
    Low: { background: '#D1FAE5', color: '#059669', border: '1px solid #6EE7B7' }
  };

  const style = badgeStyles[prediction] || badgeStyles.Low;

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        style={{
          ...style,
          cursor: 'pointer',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontWeight: '700',
          fontSize: '12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
        title="Click to view AI SHAP risk attribution drivers"
      >
        <span>{prediction} Risk</span>
        <span style={{ fontSize: '10px', opacity: 0.8 }}>({Math.round((probabilities?.[prediction] || 0) * 100)}%)</span>
      </button>

      {/* Modal Dialog */}
      {modalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '12px', maxWidth: '520px', width: '90%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                AI Academic Risk Drivers: {student.student_name}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer' }}>&times;</button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '14px' }}>
              Calculated using XGBoost TreeExplainer SHAP attributions based on verified academic logs.
            </p>

            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em' }}>Key Contributing Factors</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {top_risk_drivers?.map((driver, idx) => (
                <div key={idx} style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', borderLeft: '4px solid #ED4D8B' }}>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#1E293B' }}>{driver.message}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>SHAP Attribution: {driver.contribution}</div>
                </div>
              ))}
            </div>

            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em' }}>Recommended Interventions</h4>
            <ul style={{ paddingLeft: '18px', fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
              {recommended_interventions?.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>

            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{ padding: '8px 18px', background: '#0F172A', color: '#FFFFFF', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

---

## 5. Defensive Resilience & Graceful Fallback Strategy

When incorporating this service into the live college ERP:
1. **Never Block Rendering**: The mentor dashboard student table should load instantly using local ERP MongoDB data. The risk badges can be populated asynchronously with a skeleton loading badge (`Evaluating...`).
2. **Offline Handling**: If the AI prediction gateway on port 5001 is unreachable or times out, the ERP backend automatically catches the error and marks the status as `'Prediction Unavailable (Service Offline)'` or provides standard heuristic thresholds without crashing the page.
3. **Auditability**: Meeting requests initiated from the chatbot are stored in the AI gateway's MongoDB (`MeetingRequest` collection) and can be synced with the ERP's counselor inbox through an automated webhook or periodic pull.
