# ERP & Baymate System — Demo Accounts Reference

This document outlines the demo accounts configured for institutional demonstrations, their respective roles, permissions, and linked entities from the verified student and faculty dataset (`students.csv` and `faculty.csv`).

> **Security Notice**: Passwords are not recorded in documentation or committed to version control. Passwords are read from the `DEMO_PASSWORD` variable defined in `.env` (or auto-generated if unset).

---

## Seeded Demo User Accounts

| Username | Role | Linked ID | Name | Department | College | Risk Category / Profile |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`admin`** | `admin` | `ADMIN_CHIEF_01` | Academic Dean Office | Central Administration | C101 (Apex Engineering College) | Institutional aggregate analytics, cross-college oversight, audit logs |
| **`mentor`** | `mentor` | `FAC_MIST_IT_333` | Dr. Sudha Rajagopalan | Information Technology | C103 (Modern Institute of Science & Technology) | Faculty Mentor (19 assigned mentees: 8 High Risk, 0 Medium Risk, 11 Low Risk) |
| **`student`** | `student` | `STU_MIST_IT_Y3_5559` | Bhoomika Gowda | Information Technology | C103 (Modern Institute of Science & Technology) | **High Risk** (score 0.945, attendance 70.8%, monthly trend 80.6% &rarr; 62.8%, 27 backlogs in `students.csv`, 33 Arrear records in `marks.csv`, GPA 1.39) |
| **`student2`** | `student` | `STU_MIST_IT_Y4_5573` | Vasanth Balasubramanian | Information Technology | C103 (Modern Institute of Science & Technology) | **Low Risk / Elevated Score Contrast** (score 0.619, 7 backlogs in `students.csv`, 8 Arrear records in `marks.csv`, GPA 5.60, attendance 80.8%) |
| **`student3`** | `student` | `STU_MIST_IT_Y3_5514` | Sahana Hegde | Information Technology | C103 (Modern Institute of Science & Technology) | **Low Risk Contrast** (score 0.184, 0 backlogs in `students.csv`, 0 Arrear records in `marks.csv`, GPA 7.90, attendance 88.9%) |

---

## Dataset Alignment Details

- **Mentor Cohort**: `FAC_MIST_IT_333` manages 19 mentees in the Department of Information Technology at Modern Institute of Science & Technology (`C103`). 8 of the 19 mentees are in the High Risk category requiring immediate intervention, 0 Medium Risk, and 11 Low Risk.
- **Demo Student 1 (`student`)**: Linked to `STU_MIST_IT_Y3_5559` (Bhoomika Gowda, Year 3, Semester 6, GPA 1.39, Attendance 70.8%). Her monthly attendance trajectory shows a steep decline from 80.6% to 62.8% across six months, paired with active academic backlogs. In `students.csv`, `backlogs_count` is 27; querying `marks.csv` where `result == 'Arrear'` returns 33 rows. `backlogs_count` (students.csv) and the count of result == 'Arrear' rows (marks.csv) are generated independently and can differ. The model uses both as separate features.
- **Demo Student 2 (`student2`)**: Linked to `STU_MIST_IT_Y4_5573` (Vasanth Balasubramanian, Year 4, Semester 8, GPA 5.60, Attendance 80.8%, Risk score 0.619, Risk label Low). In `students.csv`, `backlogs_count` is 7; `marks.csv` has 8 Arrear marks records.
- **Low-Risk Contrast (`student3`)**: Linked to `STU_MIST_IT_Y3_5514` (Sahana Hegde, Year 3, Semester 6, GPA 7.90, Attendance 88.9%, Risk score 0.184, Risk label Low). 0 backlogs in `students.csv` and 0 Arrear records in `marks.csv`.
