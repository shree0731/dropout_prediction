"""Regression tests for: department schema drift, range limits, and real SHAP explanations."""
import json, os
import pandas as pd
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.predictor import VALID_DEPARTMENTS, preprocessor, predict_student

client = TestClient(app)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

BASE = dict(student_id="T", department="CSE", year_of_study=3, attendance_pct=69.6, attendance_decay=13.7,
            overall_gpa=1.54, backlogs_count=21, cutoff_mark_200=170.0, family_income_annual=300000.0,
            mentor_meetings_attended=1, first_gen_learner=0, distance_from_home_km=20.0,
            failed_subjects_count=23, core_theory_average=42.3, internal_exam_avg=22.0,
            assignment_avg=4.5, grade_trend=0.2)

def test_feature_spec_departments_equal_trained_departments():
    spec = json.load(open(os.path.join(ROOT, 'models', 'feature_spec.json')))
    allowed = next(f for f in spec['features'] if f['name'] == 'department')['allowed_values']
    assert sorted(allowed) == sorted(preprocessor.named_transformers_['cat'].categories_[0])

def test_every_department_in_students_csv_is_accepted():
    depts = pd.read_csv(os.path.join(ROOT, 'data', 'students.csv'), usecols=['department'])['department'].unique()
    assert len(depts) == 13
    for d in depts:
        r = client.post('/predict', json={**BASE, 'department': d})
        assert r.status_code == 200, (d, r.text)

@pytest.mark.parametrize('alias,expected', [('MECH', 'Mechanical'), ('civil', 'Civil'), ('AUTO', 'Automobile')])
def test_legacy_aliases_normalised(alias, expected):
    r = client.post('/predict', json={**BASE, 'department': alias})
    assert r.status_code == 200
    # same result as the canonical name
    r2 = client.post('/predict', json={**BASE, 'department': expected})
    assert r.json()['probabilities'] == r2.json()['probabilities']

def test_unknown_department_rejected():
    assert client.post('/predict', json={**BASE, 'department': 'Underwater Basket Weaving'}).status_code == 422

def test_real_data_extremes_not_rejected():
    r = client.post('/predict', json={**BASE, 'backlogs_count': 59, 'failed_subjects_count': 59})
    assert r.status_code == 200

def test_explanations_are_real_shap_not_hardcoded():
    res = predict_student(dict(BASE))
    assert res['explanation_method'] == 'shap_tree_explainer'
    drivers = res['top_risk_drivers']
    assert drivers and all('impact' in d for d in drivers)
    # SHAP impacts must vary with the student, unlike the old hard-coded "+0.34"-style strings
    healthy = predict_student({**BASE, 'attendance_pct': 88, 'attendance_decay': 0.0, 'overall_gpa': 8.0,
                               'backlogs_count': 0, 'failed_subjects_count': 0, 'core_theory_average': 75.0,
                               'internal_exam_avg': 38.0, 'assignment_avg': 8.0})
    assert healthy['prediction'] == 'Low'
    assert all(d['direction'] == 'protective' for d in healthy['top_risk_drivers'])
    assert res['top_risk_drivers'][0]['impact'] != healthy['top_risk_drivers'][0]['impact']
    assert res['top_risk_drivers'][0]['direction'] == 'raises_risk'

def test_driver_messages_quote_the_students_actual_values():
    res = predict_student({**BASE, 'attendance_decay': 17.3})
    text = ' '.join(d['message'] for d in res['top_risk_drivers'])
    assert any(tok in text for tok in ['17.3', '21 active', '1.54'])
