import os
import json
import joblib
import numpy as np
import pandas as pd
import shap
from pydantic import BaseModel, Field, ValidationError, field_validator
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

# Department names are taken from the trained preprocessor itself so the API schema can
# never drift from what the model was fitted on (it was previously a hand-typed list that
# rejected 29% of real students, e.g. 'Mechanical', 'Civil', 'Cyber Security').
VALID_DEPARTMENTS = tuple(preprocessor.named_transformers_['cat'].categories_[0])

# Legacy short codes still accepted from older clients; mapped to the trained names.
DEPARTMENT_ALIASES = {
    'MECH': 'Mechanical', 'MECHANICAL': 'Mechanical',
    'CIVIL': 'Civil',
    'AUTO': 'Automobile', 'AUTOMOBILE': 'Automobile',
    'CYBER': 'Cyber Security', 'CYBERSECURITY': 'Cyber Security', 'CYBER SECURITY': 'Cyber Security',
    'ROBOTICS': 'Robotics',
}

def normalize_department(value):
    """Case-insensitive match to a trained department name; aliases supported."""
    if not isinstance(value, str):
        return value
    key = value.strip()
    for name in VALID_DEPARTMENTS:
        if name.lower() == key.lower():
            return name
    return DEPARTMENT_ALIASES.get(key.upper(), value)

class ModelStudentFeatures(BaseModel):
    attendance_pct: float = Field(..., ge=0.0, le=100.0, description="Overall attendance percentage")
    attendance_decay: float = Field(..., ge=-100.0, le=100.0, description="Attendance drop from month 1 to last month")
    overall_gpa: float = Field(..., ge=0.0, le=10.0, description="Cumulative grade point average")
    backlogs_count: int = Field(..., ge=0, le=100, description="Total active uncleared backlogs")
    cutoff_mark_200: float = Field(..., ge=0.0, le=200.0, description="Admission cutoff mark (/200)")
    family_income_annual: float = Field(..., ge=0.0, description="Annual family income")
    mentor_meetings_attended: int = Field(..., ge=0, le=100, description="Mentor meetings attended")
    first_gen_learner: int = Field(..., ge=0, le=1, description="First-generation learner flag (0 or 1)")
    distance_from_home_km: float = Field(..., ge=0.0, le=2000.0, description="Distance from home in km")
    failed_subjects_count: int = Field(..., ge=0, le=100, description="Failed subjects in semester marks")
    core_theory_average: float = Field(..., ge=0.0, le=100.0, description="Core theory course mark average")
    internal_exam_avg: float = Field(..., ge=0.0, le=100.0, description="Average continuous internal exam marks")
    assignment_avg: float = Field(..., ge=0.0, le=100.0, description="Average continuous assignment marks")
    grade_trend: float = Field(..., ge=-10.0, le=10.0, description="Grade progression from first to latest semester")
    year_of_study: int = Field(..., ge=1, le=4, description="Curriculum year of study")
    department: Literal[VALID_DEPARTMENTS] = Field(..., description="Academic department (must be one the model was trained on)")

    @field_validator('department', mode='before')
    @classmethod
    def _normalize_department(cls, v):
        return normalize_department(v)

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

FEATURE_ORDER = [
    'attendance_pct', 'attendance_decay', 'overall_gpa', 'backlogs_count',
    'cutoff_mark_200', 'family_income_annual', 'mentor_meetings_attended',
    'first_gen_learner', 'distance_from_home_km', 'failed_subjects_count',
    'core_theory_average', 'internal_exam_avg', 'assignment_avg', 'grade_trend',
    'year_of_study', 'department'
]

def _describe_feature(feature: str, row, predicted: str) -> str:
    """Plain-language sentence for a feature, quoting the student's actual value."""
    v = row[feature]
    risky = predicted in ('Medium', 'High')
    if feature == 'backlogs_count':
        return f"{int(v)} active backlog(s)" if v else "No active backlogs"
    if feature == 'failed_subjects_count':
        return f"{int(v)} subject(s) with an Arrear result" if v else "No failed subjects"
    if feature == 'attendance_pct':
        note = " (below the 75% eligibility bar)" if v < 75 else ""
        return f"Overall attendance is {v:.1f}%{note}"
    if feature == 'attendance_decay':
        if v > 0:
            return f"Attendance fell {v:.1f} points from the first to the latest month"
        return f"Attendance is steady/improving ({-v:.1f} points change over the period)"
    if feature == 'overall_gpa':
        return f"Cumulative GPA is {v:.2f}/10"
    if feature == 'core_theory_average':
        return f"Core theory average is {v:.1f}/100"
    if feature == 'internal_exam_avg':
        return f"Internal exam average is {v:.1f}"
    if feature == 'assignment_avg':
        return f"Assignment average is {v:.1f}"
    if feature == 'grade_trend':
        return f"Grade trend across semesters is {v:+.2f} grade points"
    if feature == 'mentor_meetings_attended':
        return f"Attended {int(v)} mentor meeting(s)"
    if feature == 'cutoff_mark_200':
        return f"Admission cutoff mark is {v:.1f}/200"
    if feature == 'family_income_annual':
        return f"Annual family income is Rs {v:,.0f}"
    if feature == 'distance_from_home_km':
        return f"Lives {v:.0f} km from home"
    if feature == 'first_gen_learner':
        return "First-generation learner" if v else "Not a first-generation learner"
    if feature == 'year_of_study':
        return f"Year {int(v)} of study"
    if feature == 'department':
        return f"Department: {v}"
    return f"{feature} = {v}"

def compute_shap_drivers(X_trans, features_df: pd.DataFrame, pred_num: int, pred_label: str, top_n: int = 4):
    """
    Real per-student explanation: TreeExplainer SHAP values for the PREDICTED class,
    with one-hot department columns folded back into a single 'department' feature.
    Positive SHAP = pushes the model towards the predicted class (log-odds units).
    Returns None if the explainer is unavailable (caller falls back, labelled as such).
    """
    if tree_explainer is None:
        return None
    sv = np.asarray(tree_explainer.shap_values(X_trans))
    # Newer shap: (n_samples, n_features, n_classes); older: list of (n_samples, n_features)
    if sv.ndim == 3 and sv.shape[0] == 1:
        class_sv = sv[0, :, pred_num]
    elif sv.ndim == 3:
        class_sv = sv[pred_num, 0, :]
    else:
        return None

    names = list(preprocessor.get_feature_names_out())
    agg = {}
    for name, val in zip(names, class_sv):
        base = name.split('__', 1)[1]
        if name.startswith('cat__department_'):
            base = 'department'
        agg[base] = agg.get(base, 0.0) + float(val)

    row = features_df.iloc[0]
    risky = pred_label in ('Medium', 'High')
    ranked = sorted(((f, c) for f, c in agg.items() if c > 0.05), key=lambda x: -x[1])[:top_n]
    return [{
        "feature": f,
        "contribution": f"{c:+.2f}",
        "impact": round(c, 4),
        "direction": "raises_risk" if risky else "protective",
        "message": _describe_feature(f, row, pred_label)
    } for f, c in ranked]

def derive_rule_based_drivers(features_df: pd.DataFrame, pred_class: str) -> list:
    """Clearly-labelled fallback used only if SHAP is unavailable."""
    row = features_df.iloc[0]
    drivers = []
    if row['backlogs_count'] >= 1:
        drivers.append({"feature": "backlogs_count", "contribution": "n/a", "direction": "raises_risk",
                        "message": _describe_feature('backlogs_count', row, pred_class)})
    if row['attendance_decay'] > 10.0 or row['attendance_pct'] < 75.0:
        f = 'attendance_decay' if row['attendance_decay'] > 10.0 else 'attendance_pct'
        drivers.append({"feature": f, "contribution": "n/a", "direction": "raises_risk",
                        "message": _describe_feature(f, row, pred_class)})
    if row['overall_gpa'] < 6.0:
        drivers.append({"feature": "overall_gpa", "contribution": "n/a", "direction": "raises_risk",
                        "message": _describe_feature('overall_gpa', row, pred_class)})
    if not drivers:
        drivers.append({"feature": "overall_gpa", "contribution": "n/a", "direction": "protective",
                        "message": _describe_feature('overall_gpa', row, pred_class)})
    return drivers[:4]

def _base_interventions(pred_class: str) -> list:
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

DRIVER_INTERVENTIONS = {
    'attendance_decay': "Investigate the recent attendance drop with the student (health, transport, hostel, finances)",
    'attendance_pct': "Issue the 75% attendance shortage notice and plan compensatory classes",
    'backlogs_count': "Build an arrear-clearance plan with a tutor for each pending subject",
    'failed_subjects_count': "Arrange remedial coaching for failed subjects before the next exam window",
    'overall_gpa': "Review study habits and workload; consider a peer mentor",
    'internal_exam_avg': "Offer targeted practice for continuous internal assessments",
    'assignment_avg': "Check assignment submission difficulties and deadlines",
    'family_income_annual': "Screen the student for scholarship / fee-relief eligibility",
    'distance_from_home_km': "Review hostel or commute support",
}

def derive_recommended_interventions(pred_class: str, drivers: list) -> list:
    items = _base_interventions(pred_class)
    if pred_class in ('Medium', 'High'):
        for d in drivers:
            extra = DRIVER_INTERVENTIONS.get(d.get('feature'))
            if extra and extra not in items:
                items.append(extra)
    return items[:6]

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

    drivers = None
    method = 'shap_tree_explainer'
    try:
        drivers = compute_shap_drivers(X_trans, df, pred_num, pred_label)
    except Exception as exc:  # never let explanation failure break a prediction
        print(f"[predictor] SHAP explanation failed: {exc}")
    if not drivers:
        drivers = derive_rule_based_drivers(df, pred_label)
        method = 'rule_based_fallback'
    interventions = derive_recommended_interventions(pred_label, drivers)

    return {
        "student_id": payload.get("student_id", "STU_DEMO"),
        "prediction": pred_label,
        "probabilities": prob_dict,
        "top_risk_drivers": drivers,
        "explanation_method": method,
        "recommended_interventions": interventions
    }
