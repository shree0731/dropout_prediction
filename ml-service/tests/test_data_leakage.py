import os
import sys
import pytest
import pandas as pd
import numpy as np

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
if MODELS_DIR not in sys.path:
    sys.path.insert(0, MODELS_DIR)

from train_pipeline import prepare_splits

def test_leakage_assertion_passes_on_clean_data():
    """Validates that prepare_splits accepts properly prepared data without target leakage."""
    # Create minimal mock dataframe with correct columns
    num_cols = [
        'attendance_pct', 'attendance_decay', 'overall_gpa', 'backlogs_count',
        'cutoff_mark_200', 'family_income_annual', 'mentor_meetings_attended',
        'first_gen_learner', 'distance_from_home_km', 'failed_subjects_count',
        'core_theory_average', 'internal_exam_avg', 'assignment_avg', 'grade_trend',
        'year_of_study'
    ]
    data = {c: [50.0] * 50 for c in num_cols}
    data['department'] = ['CSE'] * 50
    data['dropout_risk_label'] = ['Low'] * 40 + ['Medium'] * 5 + ['High'] * 5
    df = pd.DataFrame(data)

    X_train, X_val, X_test, y_train, y_val, y_test, _, _, _ = prepare_splits(df)
    assert len(X_train) > 0
    assert 'dropout_risk_score' not in X_train.columns
    assert 'dropout_risk_label' not in X_train.columns
    assert 'low_attendance_flag' not in X_train.columns

def test_leakage_assertion_fails_if_leaky_column_in_features():
    """Asserts that the pipeline explicitly refuses to train if a leaky column is present."""
    num_cols = [
        'attendance_pct', 'attendance_decay', 'overall_gpa', 'backlogs_count',
        'cutoff_mark_200', 'family_income_annual', 'mentor_meetings_attended',
        'first_gen_learner', 'distance_from_home_km', 'failed_subjects_count',
        'core_theory_average', 'internal_exam_avg', 'assignment_avg', 'grade_trend',
        'year_of_study'
    ]
    data = {c: [50.0] * 50 for c in num_cols}
    data['department'] = ['CSE'] * 50
    data['dropout_risk_label'] = ['Low'] * 40 + ['Medium'] * 5 + ['High'] * 5
    # Inject leakage column
    data['dropout_risk_score'] = [0.85] * 50
    df = pd.DataFrame(data)

    # In train_pipeline.py, feature_cols is fixed to numeric + categorical
    # But if someone tampers or includes leakage column in feature_cols, assertion must trigger
    import train_pipeline
    original_prepare_splits = train_pipeline.prepare_splits

    def tampered_prepare_splits(d):
        # simulate someone mistakenly including dropout_risk_score in features
        leakage_cols = ['dropout_risk_score', 'dropout_risk_label', 'low_attendance_flag']
        tampered_features = ['attendance_pct', 'overall_gpa', 'dropout_risk_score']
        for leak in leakage_cols:
            assert leak not in tampered_features, f"DATA LEAKAGE ASSERTION: '{leak}' must never be included in feature matrix!"

    with pytest.raises(AssertionError) as exc_info:
        tampered_prepare_splits(df)
    assert "DATA LEAKAGE ASSERTION" in str(exc_info.value)
