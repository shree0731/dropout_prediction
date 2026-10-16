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
from pydantic import BaseModel, Field, ValidationError, field_validator
from typing import Optional, List, Dict, Any, Literal
from app.predictor import predict_student, EVALUATION_METRICS, ModelStudentFeatures, VALID_DEPARTMENTS, normalize_department
from app.chatbot import get_chatbot_response
import sklearn
import xgboost

app = FastAPI(
    title="AI Dropout Prediction ML Microservice",
    description="Internal machine learning microservice hosting trained XGBoost pipeline, SHAP attribution, and intervention conversational agent.",
    version="1.0.0"
)

@app.on_event("startup")
def startup_check():
    print(f"[ML Service Startup] Loaded scikit-learn version: {sklearn.__version__}")
    print(f"[ML Service Startup] Loaded xgboost version: {xgboost.__version__}")
    from app.predictor import model, preprocessor
    if model is None or preprocessor is None:
        raise RuntimeError("FATAL ERROR: Failed to load trained XGBoost model or preprocessor pipeline.")
    print("[ML Service Startup] ✓ Model and preprocessor loaded and verified successfully.")

# --- Pydantic Request Schemas ---


class PredictRequest(BaseModel):
    student_id: Optional[str] = "STU_DEMO_001"
    department: Literal[VALID_DEPARTMENTS]
    year_of_study: int = Field(..., ge=1, le=4)
    attendance_pct: float = Field(..., ge=0.0, le=100.0)
    attendance_decay: Optional[float] = None
    monthly_attendance_trend: Optional[List[float]] = None
    overall_gpa: float = Field(..., ge=0.0, le=10.0)
    backlogs_count: int = Field(..., ge=0, le=100)
    cutoff_mark_200: float = Field(..., ge=0.0, le=200.0)
    family_income_annual: float = Field(..., ge=0.0)
    mentor_meetings_attended: int = Field(..., ge=0, le=100)
    first_gen_learner: int = Field(..., ge=0, le=1)
    distance_from_home_km: float = Field(..., ge=0.0, le=2000.0)
    failed_subjects_count: int = Field(..., ge=0, le=100)
    core_theory_average: float = Field(..., ge=0.0, le=100.0)
    internal_exam_avg: float = Field(..., ge=0.0, le=100.0)
    assignment_avg: float = Field(..., ge=0.0, le=100.0)
    grade_trend: float = Field(..., ge=-10.0, le=10.0)

    @field_validator('department', mode='before')
    @classmethod
    def _normalize_department(cls, v):
        return normalize_department(v)

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
        "safety_filter": "rule_based",
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
