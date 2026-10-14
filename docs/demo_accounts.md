# ERP & Baymate System — Demo Accounts Reference

This document outlines the demo accounts configured for institutional demonstrations, their respective roles, permissions, and linked entities from the verified student and faculty dataset (`students.csv` and `faculty.csv`).

> **Security Notice**: Passwords are not recorded in documentation or committed to version control. Passwords are read from the `DEMO_PASSWORD` variable defined in `.env` (or auto-generated if unset).

---

## Seeded Demo User Accounts

| Username | Role | Linked ID | Name | Department | College | Risk Category / Profile |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`admin`** | `admin` | `ADMIN_CHIEF_01` | Academic Dean Office | Central Administration | C101 (Apex Engineering College) | Institutional aggregate analytics, cross-college oversight, audit logs |
| **`mentor`** | `mentor` | `FAC_MIST_IT_333` | Dr. Sudha Rajagopalan | Information Technology | C103 (Modern Institute of Science & Technology) | Faculty Mentor (19 assigned mentees: 8 High Risk, 11 Low Risk) |
| **`student`** | `student` | `STU_MIST_IT_Y3_5559` | Bhoomika Gowda | Information Technology | C103 (Modern Institute of Science & Technology) | **High Risk** (score 0.945, attendance decaying 80.6% &rarr; 62.8% over 6 months, 27 backlogs, GPA 1.39) |
| **`student2`** | `student` | `STU_MIST_IT_Y4_5573` | Vasanth Balasubramanian | Information Technology | C103 (Modern Institute of Science & Technology) | **Elevated Risk / Contrast** (score 0.619, 7 backlogs, GPA 5.60, attendance 80.8%) |
| **`student3`** | `student` | `STU_MIST_IT_Y3_5514` | Sahana Hegde | Information Technology | C103 (Modern Institute of Science & Technology) | **Low Risk Contrast** (score 0.184, 0 backlogs, GPA 7.90, attendance 88.9%) |

---

## Dataset Alignment Details

- **Mentor Cohort**: `FAC_MIST_IT_333` manages 19 mentees in the Department of Information Technology at Modern Institute of Science & Technology (`C103`). 8 of the 19 mentees are in the High Risk category requiring immediate intervention.
- **Demo Student 1 (`student`)**: Linked to `STU_MIST_IT_Y3_5559` (Bhoomika Gowda), whose monthly attendance trajectory shows a steep decline from 80.6% to 62.8% across six months, paired with active academic backlogs. This triggers both rule-based alerts and live ML high-risk classification.
- **Demo Student 2 (`student2`)**: Linked to `STU_MIST_IT_Y4_5573` (Vasanth Balasubramanian), demonstrating elevated risk factor interaction.
- **Low-Risk Contrast (`student3`)**: Linked to `STU_MIST_IT_Y3_5514` (Sahana Hegde), demonstrating exemplary academic progression (0 backlogs, 88.9% attendance) and low dropout probability.
