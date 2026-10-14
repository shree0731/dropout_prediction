const mlServiceClient = require('../services/mlServiceClient');
const { findDemoStudentById } = require('./demoController');

/**
 * POST /api/predict
 *
 * The request has already been validated (middleware/validation.js), so every one of the
 * 16 model features is present. This controller NEVER invents values: the previous
 * version silently filled internal_exam_avg / assignment_avg / grade_trend / core_theory_average
 * with dataset means, which made different students look identical to the model.
 *
 * If the ML microservice is unreachable we return 503 rather than fabricated probabilities.
 */
exports.predictRisk = async (req, res) => {
  const payload = req.validatedBody || req.body;
  let finalPayload = { ...payload };

  // Standalone session-token mode: for a recognised demo student, server-side truth wins
  // (so a browser client cannot tamper with a named student's record).
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
        distance_from_home_km: verifiedDemo.distance_from_home_km,
        department: verifiedDemo.department,
        year_of_study: verifiedDemo.year_of_study,
        ...(verifiedDemo.marks_features || {})
      };
    }
  }

  // Resolve the two features that may arrive inside subject_marks_summary.
  const sms = finalPayload.subject_marks_summary || {};
  if (finalPayload.failed_subjects_count === undefined) {
    finalPayload.failed_subjects_count = sms.failed_subjects_count;
  }
  if (finalPayload.core_theory_average === undefined) {
    finalPayload.core_theory_average = sms.core_theory_average;
  }

  try {
    const predictionResult = await mlServiceClient.predictStudent(finalPayload);
    return res.json({ ...predictionResult, source: 'ml_microservice' });
  } catch (err) {
    console.error('[PredictController] ML microservice unavailable:', err.message);
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'The ML prediction service is unreachable. No prediction was produced.',
      detail: err.message
    });
  }
};
