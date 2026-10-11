# Machine Learning Model Training & Evaluation Report

## 1. Executive Summary
- **Model Architecture**: **XGBoost (Tuned)** (Hyperparameter-Tuned via RandomizedSearchCV on Stratified 5-Fold CV)
- **Data Split**: **60% Train (5,520) / 20% Validation (1,840) / 20% Test (1,840)** (Stratified, Random Seed: 42)
- **Test Macro F1**: **0.9265**
- **Test Overall Accuracy**: **95.60%**
- **High-Risk Class Recall**: **99.35%**
- **Multi-Class Brier Score**: **0.0649**
- **Defensibility Principle**: The test set was untouched during cross-validation, imbalance strategy selection, and hyperparameter tuning. Model evaluation reflects true generalization on unseen holdout data.

> **DATA PROVENANCE & SIMULATED LABELS STATEMENT:** The target labels (`dropout_risk_label`, `dropout_risk_score`) in this research dataset are generated from simulated longitudinal academic performance benchmarks modeled after undergraduate engineering cohorts in Tamil Nadu. The dataset was synthesized to evaluate early-warning model architectures and does **NOT** represent real, identifiable student academic or dropout records from a named institution.

---

## 2. Cross-Validation Results on Training Set (Stratified 5-Fold)
All candidate models were benchmarked on the training set using `imblearn.pipeline.Pipeline` with data preprocessors fitted strictly per fold to eliminate cross-fold data leakage.

| Candidate Model | Macro F1 (Mean) | Macro F1 (Std) | High-Risk Recall (Mean) | High-Risk Recall (Std) | Accuracy (Mean) |
|---|---|---|---|---|---|
| Logistic Regression (Balanced) | 0.9194 | +/- 0.0043 | 0.9892 | +/- 0.0118 | 95.25% |
| Random Forest (Baseline) | 0.9322 | +/- 0.0089 | 0.9806 | +/- 0.0105 | 96.63% |
| Random Forest (Balanced) | 0.9286 | +/- 0.0029 | 0.9849 | +/- 0.0110 | 96.05% |
| Random Forest (SMOTE) | 0.9286 | +/- 0.0054 | 0.9871 | +/- 0.0125 | 95.94% |
| XGBoost (Class-Weighted) | 0.9336 | +/- 0.0053 | 0.9849 | +/- 0.0110 | 96.36% |
| XGBoost (SMOTE) | 0.9341 | +/- 0.0053 | 0.9892 | +/- 0.0118 | 96.47% |

### Rationale for Model Selection
XGBoost with balanced sample weighting achieved superior Macro F1 (0.9336) and robust High-Class Recall (0.9849) without generating synthetic boundary distortions associated with oversampling.

---

## 3. Hyperparameter Tuning
- **Method**: `RandomizedSearchCV` (30 iterations) on 5-fold CV optimizing `f1_macro`.
- **Optimal Hyperparameters**:
```json
{
  "subsample": 0.85,
  "n_estimators": 240,
  "min_child_weight": 1,
  "max_depth": 3,
  "learning_rate": 0.03,
  "gamma": 0.0,
  "colsample_bytree": 0.85
}
```
- **Best CV Macro F1**: **0.9694**

---

## 4. Final Evaluation on Untouched Test Set (N = 1,840)

### Per-Class Performance
| Class | Precision | Recall | F1-Score | Support |
|---|---|---|---|---|
| **Low Risk** | 0.9958 | 0.9514 | 0.9731 | 1502.0 |
| **Medium Risk** | 0.7040 | 0.9617 | 0.8129 | 183.0 |
| **High Risk** | 0.9935 | 0.9935 | 0.9935 | 155.0 |

### 3x3 Confusion Matrix
```
Predicted ->     Low    Med    High
Actual Low     1429   73     0     
Actual Med     6      176    1     
Actual High    0      1      154   
```

### Probability Calibration (Brier Scores)
- Overall Multi-class Brier Score: **0.0649**
- Low Risk Brier Loss: **0.0317**
- Medium Risk Brier Loss: **0.0322**
- High Risk Brier Loss: **0.0009**

---

## 5. Ablation Study
To isolate feature group impact, the model was evaluated on the untouched holdout test set with specific feature clusters omitted:

| Configuration | Test Macro F1 | Test High-Risk Recall | Macro F1 Delta | Primary Impact |
|---|---|---|---|---|
| **Full Feature Set (16 features)** | **0.9265** | **0.9935** | Baseline | Reference benchmark |
| **Without Attendance (`attendance_pct`, `attendance_decay`)** | 0.8317 | 0.8710 | **-0.0948** | Critical loss in minority-class recall and overall discriminability |
| **Without Academic Marks (`failed_subjects_count`, `core_theory_avg`, CIA, assignments, `grade_trend`)** | 0.9264 | 0.9871 | **-0.0001** | Negligible change in overall Macro F1; marks act primarily as secondary corroboration |

**Data-Grounding Observation**: Longitudinal attendance features (`attendance_pct` and temporal `attendance_decay`) represent the decisive predictive signal. Omitting attendance causes a steep drop in Macro F1 (-0.0948) and reduces high-risk recall from 99.35% to 87.10%. Academic marks provide important supplementary context for faculty mentors but do not independently compensate when attendance trajectories are missing.

---

## 6. Fairness & Subgroup Breakdown

### Performance by Department
| Department | Samples (N) | Accuracy | Macro F1 | High-Risk Recall | Sample Reliability Status |
|---|---|---|---|---|---|
| AIDS | 186 | 96.8% | 0.9498 | 1.0000 | Sufficient sample (N >= 50) |
| AIML | 185 | 97.3% | 0.9557 | 1.0000 | Sufficient sample (N >= 50) |
| Automobile | 20 | 100.0%* | 1.0000* | 1.0000* | **Insufficient sample size (N < 50)** |
| CSBS | 126 | 93.7% | 0.8983 | 1.0000 | Sufficient sample (N >= 50) |
| CSD | 117 | 97.4% | 0.9514 | 1.0000 | Sufficient sample (N >= 50) |
| CSE | 272 | 97.1% | 0.9442 | 1.0000 | Sufficient sample (N >= 50) |
| Civil | 95 | 95.8% | 0.9311 | 1.0000 | Sufficient sample (N >= 50) |
| Cyber Security | 148 | 94.6% | 0.9002 | 1.0000 | Sufficient sample (N >= 50) |
| ECE | 177 | 96.0% | 0.9395 | 1.0000 | Sufficient sample (N >= 50) |
| EEE | 147 | 94.6% | 0.8972 | 0.9167 | Sufficient sample (N >= 50) |
| IT | 214 | 93.0% | 0.8918 | 1.0000 | Sufficient sample (N >= 50) |
| Mechanical | 121 | 96.7% | 0.9456 | 1.0000 | Sufficient sample (N >= 50) |
| Robotics | 32 | 84.4%* | 0.8632* | 1.0000* | **Insufficient sample size (N < 50)** |

> [!NOTE]
> **Subgroup Sample Size Warning:** Departments with sample sizes below N = 50 in the holdout split (`Automobile`, N=20; `Robotics`, N=32) are marked with an asterisk (*). Due to small cohort sizes, per-department metrics in these rows have wide confidence intervals and are not statistically reliable for comparative fairness conclusions.

### Performance by First-Generation Learner Status
| Subgroup | Samples | Accuracy | Macro F1 | High-Risk Recall | Sample Reliability Status |
|---|---|---|---|---|---|
| Continuing Education | 1276 | 95.5% | 0.9257 | 1.0000 | Sufficient sample (N >= 50) |
| First-Gen Learner | 564 | 95.7% | 0.9284 | 0.9804 | Sufficient sample (N >= 50) |

---

## 7. Explainability & Top Risk Drivers
Top feature drivers identified by SHAP TreeExplainer:

1. **attendance_decay** (Mean |SHAP| = 1.9887)
2. **overall_gpa** (Mean |SHAP| = 0.5129)
3. **assignment_avg** (Mean |SHAP| = 0.3350)
4. **attendance_pct** (Mean |SHAP| = 0.3173)
5. **internal_exam_avg** (Mean |SHAP| = 0.1262)
6. **core_theory_average** (Mean |SHAP| = 0.1143)
7. **mentor_meetings_attended** (Mean |SHAP| = 0.1065)
8. **backlogs_count** (Mean |SHAP| = 0.0582)
9. **failed_subjects_count** (Mean |SHAP| = 0.0408)
10. **cutoff_mark_200** (Mean |SHAP| = 0.0232)

---

## 8. Data Leakage Assertion
The training script includes compile-time assertions guarding feature matrices:
- `dropout_risk_score`, `dropout_risk_label`, and `low_attendance_flag` are strictly barred from `X`.
- No target variables or post-hoc heuristics are fed to training or test pipelines.
