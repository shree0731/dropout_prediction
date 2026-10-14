import os
import json
import pytest
import pandas as pd
import numpy as np

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FIXTURE_PATH = os.path.join(BASE_DIR, '..', 'FSD', 'backend', 'tests', 'fixtures', 'training_20_features.json')

def test_feature_parity_20_students():
    """
    Validates that the 20 test student features defined in the parity fixture
    satisfy all required schema definitions and data type bounds.
    """
    assert os.path.exists(FIXTURE_PATH), f"Fixture not found at {FIXTURE_PATH}"

    with open(FIXTURE_PATH, 'r') as f:
        records = json.load(f)

    assert len(records) == 20

    numeric_cols = [
        'attendance_pct', 'attendance_decay', 'overall_gpa', 'backlogs_count',
        'cutoff_mark_200', 'family_income_annual', 'mentor_meetings_attended',
        'first_gen_learner', 'distance_from_home_km', 'failed_subjects_count',
        'core_theory_average', 'internal_exam_avg', 'assignment_avg', 'grade_trend',
        'year_of_study'
    ]

    for rec in records:
        assert 'student_id' in rec
        assert 'department' in rec
        from app.predictor import VALID_DEPARTMENTS
        assert rec['department'] in VALID_DEPARTMENTS

        for col in numeric_cols:
            assert col in rec
            val = float(rec[col])
            assert not np.isnan(val)

        assert 0.0 <= rec['attendance_pct'] <= 100.0
        assert 0.0 <= rec['overall_gpa'] <= 10.0
        assert rec['backlogs_count'] >= 0
        assert rec['first_gen_learner'] in [0, 1]
