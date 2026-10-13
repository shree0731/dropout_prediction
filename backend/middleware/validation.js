const { z } = require('zod');

const VALID_DEPARTMENTS = [
  'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL',
  'AIDS', 'AIML', 'CSBS', 'BME', 'CHEM', 'AUTO', 'AERO'
];

const predictSchema = z.object({
  student_id: z.string().max(50).optional(),
  department: z.enum(VALID_DEPARTMENTS, {
    errorMap: () => ({ message: `Department must be one of: ${VALID_DEPARTMENTS.join(', ')}` })
  }).default('CSE'),
  year_of_study: z.number().int().min(1).max(4).optional().default(1),
  attendance_pct: z.number().min(0, 'Attendance must be at least 0').max(100, 'Attendance cannot exceed 100'),
  monthly_attendance_trend: z.array(z.number().min(0).max(100)).max(24).optional().default([]),
  overall_gpa: z.number().min(0, 'GPA cannot be negative').max(10, 'GPA cannot exceed 10.0'),
  backlogs_count: z.number().int().min(0, 'Backlogs count cannot be negative').max(50, 'Backlogs count capped at 50'),
  cutoff_mark_200: z.number().min(0).max(200).optional().default(165.0),
  mentor_meetings_attended: z.number().int().min(0).max(100).optional().default(2),
  family_income_annual: z.number().min(0).optional().default(250000),
  first_gen_learner: z.number().int().min(0).max(1).optional().default(0),
  distance_from_home_km: z.number().min(0).max(2000).optional().default(25.0),
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
    failed_subjects_count: z.number().int().min(0).optional(),
    core_theory_average: z.number().min(0).max(100).optional()
  }).optional(),
  
  // Direct marks fields
  avg_total_marks: z.number().min(0).max(100).optional(),
  min_total_marks: z.number().min(0).max(100).optional(),
  std_total_marks: z.number().min(0).max(100).optional(),
  failed_subjects: z.number().int().min(0).max(50).optional(),
  failed_subjects_count: z.number().int().min(0).max(50).optional(),
  core_theory_average: z.number().min(0).max(100).optional(),
  internal_exam_avg: z.number().min(0).max(100).optional(),
  avg_external: z.number().min(0).max(100).optional(),
  assignment_avg: z.number().min(0).max(100).optional(),
  grade_trend: z.number().min(-10).max(10).optional(),
  attendance_decay: z.number().min(-100).max(100).optional()
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
    backlogs_count: z.number().int().min(0).max(50).optional(),
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
  VALID_DEPARTMENTS
};
