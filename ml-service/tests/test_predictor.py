import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

VALID_PAYLOAD = {
    "student_id": "STU_TEST_0001",
    "department": "CSE",
    "year_of_study": 2,
    "attendance_pct": 68.5,
    "attendance_decay": 4.2,
    "overall_gpa": 5.4,
    "backlogs_count": 3,
    "cutoff_mark_200": 155.0,
    "family_income_annual": 450000.0,
    "mentor_meetings_attended": 2,
    "first_gen_learner": 1,
    "distance_from_home_km": 15.0,
    "failed_subjects_count": 2,
    "core_theory_average": 52.0,
    "internal_exam_avg": 24.0,
    "assignment_avg": 5.0,
    "grade_trend": -0.4
}

def test_valid_payload_returns_expected_structure():
    response = client.post("/predict", json=VALID_PAYLOAD)
    assert response.status_code == 200, response.text
    data = response.json()

    assert "prediction" in data
    assert data["prediction"] in ["Low", "Medium", "High"]
    assert "probabilities" in data
    assert set(data["probabilities"].keys()) == {"Low", "Medium", "High"}
    assert "top_risk_drivers" in data
    assert isinstance(data["top_risk_drivers"], list)
    assert "recommended_interventions" in data
    assert isinstance(data["recommended_interventions"], list)

def test_probabilities_sum_to_one():
    response = client.post("/predict", json=VALID_PAYLOAD)
    assert response.status_code == 200
    probs = response.json()["probabilities"]
    total = sum(probs.values())
    assert abs(total - 1.0) <= 1e-4

def test_missing_required_field_returns_422():
    payload = VALID_PAYLOAD.copy()
    del payload["attendance_pct"]
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

def test_out_of_range_attendance_returns_422():
    payload = VALID_PAYLOAD.copy()
    payload["attendance_pct"] = 150.0  # Must be <= 100.0
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

def test_out_of_range_gpa_returns_422():
    payload = VALID_PAYLOAD.copy()
    payload["overall_gpa"] = -1.5  # Must be >= 0.0
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

def test_invalid_department_returns_422():
    payload = VALID_PAYLOAD.copy()
    payload["department"] = "ASTRONOMY"  # Not in allowed departments list
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

def test_risk_drivers_non_empty_for_medium_or_high():
    response = client.post("/predict", json=VALID_PAYLOAD)
    assert response.status_code == 200
    data = response.json()
    if data["prediction"] in ["Medium", "High"]:
        assert len(data["top_risk_drivers"]) > 0
