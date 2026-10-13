const mlServiceClient = require('../services/mlServiceClient');
const { findDemoStudentById } = require('./demoController');

exports.predictRisk = async (req, res) => {
  const payload = req.validatedBody || req.body;
  let finalPayload = { ...payload };

  // Subtask 5.3: In standalone session-token mode, if student_id is a recognized demo student, enforce server-side truth
  if (req.authType === 'session-token' && payload.student_id && payload.student_id !== 'STU_CUSTOM') {
    const verifiedDemo = await findDemoStudentById(payload.student_id);
    if (verifiedDemo) {
      finalPayload = {
        ...finalPayload,
        attendance_pct: verifiedDemo.attendance_pct,
        overall_gpa: verifiedDemo.overall_gpa,
        backlogs_count: verifiedDemo.backlogs_count,
        cutoff_mark_200: verifiedDemo.cutoff_mark_200,
        mentor_meetings_attended: verifiedDemo.mentor_meetings_attended,
        family_income_annual: verifiedDemo.family_income_annual,
        first_gen_learner: verifiedDemo.first_gen_learner,
        distance_from_home_km: verifiedDemo.distance_from_home_km
      };
    }
  }

  // Ensure all 16 required model features are defined
  if (finalPayload.failed_subjects_count === undefined) {
    finalPayload.failed_subjects_count = finalPayload.failed_subjects !== undefined
      ? Number(finalPayload.failed_subjects)
      : Number(finalPayload.backlogs_count || 0);
  }
  if (finalPayload.core_theory_average === undefined) {
    finalPayload.core_theory_average = finalPayload.avg_total_marks !== undefined
      ? Number(finalPayload.avg_total_marks)
      : 67.621533;
  }
  if (finalPayload.internal_exam_avg === undefined) {
    finalPayload.internal_exam_avg = 34.129502;
  }
  if (finalPayload.assignment_avg === undefined) {
    finalPayload.assignment_avg = 6.826053;
  }
  if (finalPayload.grade_trend === undefined) {
    finalPayload.grade_trend = 0.0;
  }

  try {
    const predictionResult = await mlServiceClient.predictStudent(finalPayload);
    return res.json(predictionResult);
  } catch (err) {
    console.warn('[PredictController Notice] ML microservice unreachable, executing fallback scoring:', err.message);
    const { attendance_pct = 75, overall_gpa = 6.8, backlogs_count = 0, student_id = 'STU_CUSTOM' } = finalPayload;

    let prediction = 'Low';
    let probas = { Low: 0.85, Medium: 0.10, High: 0.05 };

    if (backlogs_count >= 3 || (attendance_pct < 65 && overall_gpa < 5.5)) {
      prediction = 'High';
      probas = { Low: 0.10, Medium: 0.15, High: 0.75 };
    } else if (backlogs_count >= 1 || attendance_pct < 75 || overall_gpa < 6.5) {
      prediction = 'Medium';
      probas = { Low: 0.25, Medium: 0.60, High: 0.15 };
    }

    const drivers = [];
    if (backlogs_count > 0) {
      drivers.push({ feature: 'backlogs_count', contribution: '+0.34', message: `${backlogs_count} active uncleared backlogs detected across semesters` });
    }
    if (attendance_pct < 75) {
      drivers.push({ feature: 'attendance_pct', contribution: '+0.25', message: `Attendance (${attendance_pct}%) is below statutory 75% exam eligibility` });
    }
    if (overall_gpa < 6.0) {
      drivers.push({ feature: 'overall_gpa', contribution: '+0.20', message: `Cumulative GPA (${overall_gpa}/10) reflects sustained academic stress` });
    }
    if (!drivers.length) {
      drivers.push({ feature: 'attendance_pct', contribution: '-0.30', message: `Healthy attendance (${attendance_pct}%) with regular attendance` });
      drivers.push({ feature: 'overall_gpa', contribution: '-0.25', message: `Stable GPA performance (${overall_gpa}/10) with 0 active backlogs` });
    }

    const recommended = prediction === 'High'
      ? ['Schedule mandatory 1-on-1 faculty mentor counseling session', 'Enroll in remedial tutorial classes for core subjects', 'Issue statutory attendance warning']
      : prediction === 'Medium'
      ? ['Schedule proactive advisory meeting with department mentor', 'Enroll in peer study group for theory courses']
      : ['Maintain regular attendance and continuous assessment track'];

    return res.json({
      student_id,
      prediction,
      probabilities: probas,
      top_risk_drivers: drivers,
      recommended_interventions: recommended,
      source: 'express_fallback_inference'
    });
  }
};
