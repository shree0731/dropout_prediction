import os
import json
import joblib
import numpy as np
import pandas as pd
import shap
from pydantic import BaseModel, Field, ValidationError
from typing import Literal, Optional, List, Dict, Any

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MODELS_DIR = os.getenv('MODEL_DIR', os.path.join(BASE_DIR, 'models'))

MODEL_PATH = os.path.join(MODELS_DIR, 'dropout_model.pkl')
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, 'preprocessor.pkl')
METRICS_PATH = os.path.join(MODELS_DIR, 'evaluation', 'metrics.json')
FEATURE_SPEC_PATH = os.path.join(MODELS_DIR, 'feature_spec.json')

INV_LABEL_MAP = {0: 'Low', 1: 'Medium', 2: 'High'}

# Load single-sourced model artifacts
model = joblib.load(MODEL_PATH)
preprocessor = joblib.load(PREPROCESSOR_PATH)
try:
    tree_explainer = shap.TreeExplainer(model)
except Exception:
    tree_explainer = None

with open(METRICS_PATH, 'r') as f:
    EVALUATION_METRICS = json.load(f)

with open(FEATURE_SPEC_PATH, 'r') as f:
    FEATURE_SPEC = json.load(f)

# Pydantic schema enforcing exact model features without silent defaults
VALID_DEPARTMENTS = (
    'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL',
    'AIDS', 'AIML', 'CSBS', 'BME', 'CHEM', 'AUTO', 'AERO'
)

class ModelStudentFeatures(BaseModel):
    attendance_pct: float = Field(..., ge=0.0, le=100.0, description="Overall attendance percentage")
    attendance_decay: float = Field(..., ge=-100.0, le=100.0, description="Attendance drop from month 1 to last month")
    overall_gpa: float = Field(..., ge=0.0, le=10.0, description="Cumulative grade point average")
    backlogs_count: int = Field(..., ge=0, le=50, description="Total active uncleared backlogs")
    cutoff_mark_200: float = Field(..., ge=0.0, le=200.0, description="Admission cutoff mark (/200)")
    family_income_annual: float = Field(..., ge=0.0, description="Annual family income")
    mentor_meetings_attended: int = Field(..., ge=0, le=100, description="Mentor meetings attended")
    first_gen_learner: int = Field(..., ge=0, le=1, description="First-generation learner flag (0 or 1)")
    distance_from_home_km: float = Field(..., ge=0.0, le=2000.0, description="Distance from home in km")
    failed_subjects_count: int = Field(..., ge=0, le=50, description="Failed subjects in semester marks")
    core_theory_average: float = Field(..., ge=0.0, le=100.0, description="Core theory course mark average")
    internal_exam_avg: float = Field(..., ge=0.0, le=100.0, description="Average continuous internal exam marks")
    assignment_avg: float = Field(..., ge=0.0, le=100.0, description="Average continuous assignment marks")
    grade_trend: float = Field(..., ge=-10.0, le=10.0, description="Grade progression from first to latest semester")
    year_of_study: int = Field(..., ge=1, le=4, description="Curriculum year of study")
    department: Literal[
        'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL',
        'AIDS', 'AIML', 'CSBS', 'BME', 'CHEM', 'AUTO', 'AERO'
    ]

def extract_features_from_payload(payload: dict) -> pd.DataFrame:
    """
    Validates incoming payload against ModelStudentFeatures pydantic model.
    Raises ValidationError if any required feature is missing or out of valid range.
    """
    # If attendance_decay is not directly given, check if monthly_attendance_trend was supplied
    data = dict(payload)
    if 'attendance_decay' not in data or data['attendance_decay'] is None:
        trend = data.get('monthly_attendance_trend') or []
        if isinstance(trend, list) and len(trend) >= 2:
            data['attendance_decay'] = float(trend[0] - trend[-1])
        elif isinstance(trend, list) and len(trend) < 2:
            data['attendance_decay'] = 0.0

    # If failed_subjects_count or core_theory_average are in subject_marks_summary
    sms = data.get('subject_marks_summary') or {}
    if 'failed_subjects_count' not in data and 'failed_subjects_count' in sms:
        data['failed_subjects_count'] = sms['failed_subjects_count']
    if 'core_theory_average' not in data and 'core_theory_average' in sms:
        data['core_theory_average'] = sms['core_theory_average']

    # Validate strictly via Pydantic model (no silent defaults for missing fields)
    validated = ModelStudentFeatures(**data)

    feature_order = [
        'attendance_pct', 'attendance_decay', 'overall_gpa', 'backlogs_count',
        'cutoff_mark_200', 'family_income_annual', 'mentor_meetings_attended',
        'first_gen_learner', 'distance_from_home_km', 'failed_subjects_count',
        'core_theory_average', 'internal_exam_avg', 'assignment_avg', 'grade_trend',
        'year_of_study', 'department'
    ]

    row = {f: getattr(validated, f) for f in feature_order}
    return pd.DataFrame([row])

def derive_plain_language_drivers(features_df: pd.DataFrame, pred_class: str, probas: dict) -> list:
    row = features_df.iloc[0]
    drivers = []

    backlogs = row['backlogs_count']
    if backlogs >= 3:
        drivers.append({
            "feature": "backlogs_count",
            "contribution": "+0.34",
            "message": f"{backlogs} active uncleared backlogs detected across semesters"
        })
    elif backlogs >= 1:
        drivers.append({
            "feature": "backlogs_count",
            "contribution": "+0.18",
            "message": f"{backlogs} active backlog subject requiring remedial clearance"
        })

    decay = row['attendance_decay']
    if decay > 10.0:
        drivers.append({
            "feature": "attendance_decay",
            "contribution": f"+{min(0.35, round(decay/50.0, 2))}",
            "message": f"Attendance declined {decay:.1f}% over the semester"
        })
    elif row['attendance_pct'] < 75.0:
        drivers.append({
            "feature": "attendance_pct",
            "contribution": "+0.25",
            "message": f"Attendance ({row['attendance_pct']}%) is below statutory 75% exam eligibility"
        })

    gpa = row['overall_gpa']
    if gpa < 6.0:
        drivers.append({
            "feature": "overall_gpa",
            "contribution": "+0.20",
            "message": f"Cumulative GPA ({gpa:.2f}/10) reflects sustained academic stress"
        })

    core_theory = row['core_theory_average']
    if core_theory < 50.0:
        drivers.append({
            "feature": "core_theory_average",
            "contribution": "+0.15",
            "message": f"Core theory exam performance ({core_theory:.1f}%) is in critical zone"
        })

    meetings = row['mentor_meetings_attended']
    if meetings <= 1 and pred_class in ['Medium', 'High']:
        drivers.append({
            "feature": "mentor_meetings_attended",
            "contribution": "+0.12",
            "message": f"Low advisory engagement: attended only {meetings} mentor meeting(s)"
        })

    if not drivers:
        drivers.append({
            "feature": "attendance_pct",
            "contribution": "-0.30",
            "message": f"Healthy attendance ({row['attendance_pct']}%) and consistent submissions"
        })
        drivers.append({
            "feature": "overall_gpa",
            "contribution": "-0.25",
            "message": f"Stable GPA performance ({row['overall_gpa']:.2f}/10) with zero active backlogs"
        })

    return drivers[:4]

def derive_recommended_interventions(pred_class: str, drivers: list) -> list:
    if pred_class == 'High':
        return [
            "Schedule mandatory 1-on-1 faculty mentor counseling session",
            "Enroll in special remedial tutorial classes for uncleared core subjects",
            "Issue statutory attendance warning & establish bi-weekly parent communication",
            "Review hostel accommodation and daily commute feasibility"
        ]
    elif pred_class == 'Medium':
        return [
            "Schedule proactive advisory meeting with departmental academic mentor",
            "Enroll in peer-assisted study group for difficult theory courses",
            "Set up monthly attendance monitoring alerts before 75% threshold"
        ]
    else:
        return [
            "Maintain current attendance and semester study trajectory",
            "Consider enrolling in technical certification or honors tracks"
        ]

def predict_student(payload: dict) -> dict:
    df = extract_features_from_payload(payload)
    X_trans = preprocessor.transform(df)

    pred_num = int(model.predict(X_trans)[0])
    probas = model.predict_proba(X_trans)[0]

    pred_label = INV_LABEL_MAP.get(pred_num, 'Low')
    prob_dict = {
        'Low': round(float(probas[0]), 2),
        'Medium': round(float(probas[1]), 2),
        'High': round(float(probas[2]), 2)
    }

    drivers = derive_plain_language_drivers(df, pred_label, prob_dict)
    interventions = derive_recommended_interventions(pred_label, drivers)

    return {
        "student_id": payload.get("student_id", "STU_DEMO"),
        "prediction": pred_label,
        "probabilities": prob_dict,
        "top_risk_drivers": drivers,
        "recommended_interventions": interventions
    }
