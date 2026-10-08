"""
FastAPI ML Microservice for Student Academic Dropout Prediction & Intervention
Internal Microservice running on port 8001.
Endpoints:
- POST /predict : Runs XGBoost classifier & extracts plain-language risk drivers
- POST /chat    : Context-grounded empathetic academic advisor with meeting escalation
- GET  /metrics : Evaluated performance benchmarks & SHAP feature importances
- GET  /health  : Service health check
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, ValidationError
from typing import Optional, List, Dict, Any, Literal
from app.predictor import predict_student, EVALUATION_METRICS, ModelStudentFeatures
from app.chatbot import get_chatbot_response

app = FastAPI(
    title="AI Dropout Prediction ML Microservice",
    description="Internal machine learning microservice hosting trained XGBoost pipeline, SHAP attribution, and intervention conversational agent.",
    version="1.0.0"
)

# --- Pydantic Request Schemas ---

class PredictRequest(BaseModel):
    student_id: Optional[str] = "STU_DEMO_001"
    department: Literal[
        'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL',
        'AIDS', 'AIML', 'CSBS', 'BME', 'CHEM', 'AUTO', 'AERO'
    ]
    year_of_study: int = Field(..., ge=1, le=4)
    attendance_pct: float = Field(..., ge=0.0, le=100.0)
    attendance_decay: Optional[float] = None
    monthly_attendance_trend: Optional[List[float]] = None
    overall_gpa: float = Field(..., ge=0.0, le=10.0)
    backlogs_count: int = Field(..., ge=0, le=50)
    cutoff_mark_200: float = Field(..., ge=0.0, le=200.0)
    family_income_annual: float = Field(..., ge=0.0)
    mentor_meetings_attended: int = Field(..., ge=0, le=100)
    first_gen_learner: int = Field(..., ge=0, le=1)
    distance_from_home_km: float = Field(..., ge=0.0, le=2000.0)
    failed_subjects_count: int = Field(..., ge=0, le=50)
    core_theory_average: float = Field(..., ge=0.0, le=100.0)
    internal_exam_avg: float = Field(..., ge=0.0, le=100.0)
    assignment_avg: float = Field(..., ge=0.0, le=100.0)
    grade_trend: float = Field(..., ge=-10.0, le=10.0)

class ChatRequest(BaseModel):
    message: str
    student_context: Optional[Dict[str, Any]] = {}

# --- API Endpoints ---

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ai-dropout-prediction-ml-microservice",
        "model_loaded": "XGBoost",
        "port": 8001
    }

@app.get("/metrics")
def get_model_metrics():
    """
    Returns saved model evaluation report, confusion matrix, and feature importances.
    """
    return EVALUATION_METRICS

@app.post("/predict")
def predict_endpoint(req: PredictRequest):
    """
    Predicts student dropout risk (Low / Medium / High), probabilities,
    and plain-language contributing drivers.
    Requires all 16 model features without silent defaults.
    """
    try:
        payload = req.model_dump()
        result = predict_student(payload)
        return result
    except ValidationError as ve:
        raise HTTPException(status_code=422, detail=ve.errors())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failure: {str(e)}")

@app.post("/chat")
def chat_endpoint(req: ChatRequest):
    """
    Executes context-aware intervention counseling and detects meeting/escalation intent.
    """
    try:
        res = get_chatbot_response(req.message, req.student_context or {})
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot execution failure: {str(e)}")
