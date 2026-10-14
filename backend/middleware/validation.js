const { z } = require('zod');

const fs = require('fs');
const path = require('path');

// Single source of truth: the same feature_spec.json the ML service is tested against
// (a Python test asserts it equals the departments the model was actually trained on).
const FEATURE_SPEC = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../models/feature_spec.json'), 'utf8')
);
const VALID_DEPARTMENTS = FEATURE_SPEC.features.find(f => f.name === 'department').allowed_values;

// Legacy short codes accepted from older clients, mapped to trained names.
const DEPARTMENT_ALIASES = {
  MECH: 'Mechanical', MECHANICAL: 'Mechanical', CIVIL: 'Civil',
  AUTO: 'Automobile', AUTOMOBILE: 'Automobile', ROBOTICS: 'Robotics',
  CYBER: 'Cyber Security', CYBERSECURITY: 'Cyber Security', 'CYBER SECURITY': 'Cyber Security'
};

function normalizeDepartment(value) {
  if (typeof value !== 'string') return value;
  const key = value.trim();
  const exact = VALID_DEPARTMENTS.find(d => d.toLowerCase() === key.toLowerCase());
  return exact || DEPARTMENT_ALIASES[key.toUpperCase()] || key;
}

const predictSchema = z.object({
  student_id: z.string().max(50).optional(),
  department: z.preprocess(normalizeDepartment, z.enum(VALID_DEPARTMENTS, {
    errorMap: () => ({ message: `Department must be one of: ${VALID_DEPARTMENTS.join(', ')}` })
  })),
  year_of_study: z.number().int().min(1).max(4),
  attendance_pct: z.number().min(0, 'Attendance must be at least 0').max(100, 'Attendance cannot exceed 100'),
  monthly_attendance_trend: z.array(z.number().min(0).max(100)).max(24).optional().default([]),
  overall_gpa: z.number().min(0, 'GPA cannot be negative').max(10, 'GPA cannot exceed 10.0'),
  backlogs_count: z.number().int().min(0, 'Backlogs count cannot be negative').max(100, 'Backlogs count capped at 100'),
  cutoff_mark_200: z.number().min(0).max(200),
  mentor_meetings_attended: z.number().int().min(0).max(100),
  family_income_annual: z.number().min(0),
  first_gen_learner: z.number().int().min(0).max(1),
  distance_from_home_km: z.number().min(0).max(2000),
  hosteller: z.number().int().min(0).max(1).optional().default(0),
  scholarship: z.number().int().min(0).max(1).optional().default(0),
  internship_done: z.number().int().min(0).max(1).optional().default(0),
  low_attendance_flag: z.number().int().min(0).max(1).optional().default(0),
  extracurricular_score: z.number().min(0).max(100).optional().default(50.0),
  library_usage_score: z.number().min(0).max(100).optional().default(50.0),
  placement_training_score: z.number().min(0).max(100).optional().default(0.0),
  arrears_cleared: z.number().int().min(0).max(50).optional().default(0),
  
  // Marks / summary extensions
  subject_marks_summary: z.object({
    failed_subjects_count: z.number().int().min(0).max(100).optional(),
    core_theory_average: z.number().min(0).max(100).optional()
  }).optional(),
  
  // Direct marks fields
  avg_total_marks: z.number().min(0).max(100).optional(),
  min_total_marks: z.number().min(0).max(100).optional(),
  std_total_marks: z.number().min(0).max(100).optional(),
  failed_subjects: z.number().int().min(0).max(100).optional(),
  failed_subjects_count: z.number().int().min(0).max(100).optional(),
  core_theory_average: z.number().min(0).max(100).optional(),
  internal_exam_avg: z.number().min(0).max(100).optional(),
  avg_external: z.number().min(0).max(100).optional(),
  assignment_avg: z.number().min(0).max(100).optional(),
  grade_trend: z.number().min(-10).max(10).optional(),
  attendance_decay: z.number().min(-100).max(100).optional()
}).superRefine((d, ctx) => {
  const need = (ok, field, message) => { if (!ok) ctx.addIssue({ code: 'custom', path: [field], message }); };
  const sms = d.subject_marks_summary || {};
  need(d.failed_subjects_count !== undefined || sms.failed_subjects_count !== undefined,
    'failed_subjects_count', 'failed_subjects_count is required (top-level or in subject_marks_summary)');
  need(d.core_theory_average !== undefined || sms.core_theory_average !== undefined,
    'core_theory_average', 'core_theory_average is required (top-level or in subject_marks_summary)');
  need(d.internal_exam_avg !== undefined, 'internal_exam_avg', 'internal_exam_avg is required');
  need(d.assignment_avg !== undefined, 'assignment_avg', 'assignment_avg is required');
  need(d.grade_trend !== undefined, 'grade_trend', 'grade_trend is required');
  need(d.attendance_decay !== undefined || (d.monthly_attendance_trend && d.monthly_attendance_trend.length >= 2),
    'attendance_decay', 'attendance_decay or monthly_attendance_trend (>=2 months) is required');
});

const chatSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message cannot exceed 2000 characters'),
  student_context: z.object({
    student_id: z.string().max(50).optional(),
    student_name: z.string().max(100).optional(),
    department: z.string().max(50).optional(),
    year_of_study: z.number().int().min(1).max(4).optional(),
    attendance_pct: z.number().min(0).max(100).optional(),
    overall_gpa: z.number().min(0).max(10).optional(),
    backlogs_count: z.number().int().min(0).max(100).optional(),
    mentor_name: z.string().max(100).optional(),
    prediction: z.string().max(20).optional()
  }).optional().default({})
});

function formatZodErrors(error) {
  const issues = error?.issues || error?.errors || [];
  return issues.map(err => ({
    field: Array.isArray(err.path) ? err.path.join('.') : String(err.path || ''),
    message: err.message
  }));
}

const validatePredictPayload = (req, res, next) => {
  const result = predictSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({
      error: 'Unprocessable Entity',
      message: 'Invalid prediction payload',
      errors: formatZodErrors(result.error)
    });
  }
  req.validatedBody = result.data;
  next();
};

const validateChatPayload = (req, res, next) => {
  const result = chatSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({
      error: 'Unprocessable Entity',
      message: 'Invalid chat payload',
      errors: formatZodErrors(result.error)
    });
  }
  req.validatedBody = result.data;
  next();
};

module.exports = {
  validatePredictPayload,
  validateChatPayload,
  predictSchema,
  chatSchema,
  VALID_DEPARTMENTS,
  normalizeDepartment
};
