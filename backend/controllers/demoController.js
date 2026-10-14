const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DATA_PATH = path.join(__dirname, '../../data/students.csv');
const MARKS_PATH = path.join(__dirname, '../../data/marks.csv');
let cachedDemoStudents = null;

/**
 * Computes the five marks-derived model features for the selected demo students from the
 * real marks.csv, using the SAME formulas as models/train_pipeline.py:
 *   failed_subjects_count = count(result == 'Arrear')
 *   core_theory_average   = mean(total_marks | Theory)
 *   internal_exam_avg     = mean((internal_exam_1 + internal_exam_2) / 2)
 *   assignment_avg        = mean((assignment_1 + assignment_2) / 2)
 *   grade_trend           = mean grade_point(last semester) - mean grade_point(first semester)
 */
async function attachMarksFeatures(students) {
  const wanted = new Map(students.map(s => [s.student_id, { failed: 0, theory: [], cia: [], asg: [], sem: {} }]));
  if (!wanted.size || !fs.existsSync(MARKS_PATH)) return;

  const rl = readline.createInterface({ input: fs.createReadStream(MARKS_PATH, { encoding: 'utf-8' }), crlfDelay: Infinity });
  let header = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = line.split(',');
    if (!header) { header = cols.map(c => c.trim()); continue; }
    const acc = wanted.get(cols[0]);
    if (!acc) continue;
    const r = {};
    header.forEach((h, i) => { r[h] = cols[i]; });
    if (r.result && r.result.trim() === 'Arrear') acc.failed += 1;
    if (r.subject_type === 'Theory') acc.theory.push(Number(r.total_marks));
    acc.cia.push((Number(r.internal_exam_1_marks) + Number(r.internal_exam_2_marks)) / 2);
    acc.asg.push((Number(r.assignment_1_marks) + Number(r.assignment_2_marks)) / 2);
    (acc.sem[r.semester] = acc.sem[r.semester] || []).push(Number(r.grade_point));
  }

  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  for (const s of students) {
    const a = wanted.get(s.student_id);
    const sems = Object.keys(a.sem).map(Number).sort((x, y) => x - y);
    s.marks_features = {
      failed_subjects_count: a.failed,
      core_theory_average: a.theory.length ? Number(mean(a.theory).toFixed(6)) : undefined,
      internal_exam_avg: a.cia.length ? Number(mean(a.cia).toFixed(6)) : undefined,
      assignment_avg: a.asg.length ? Number(mean(a.asg).toFixed(6)) : undefined,
      grade_trend: sems.length >= 2 ? Number((mean(a.sem[sems[sems.length - 1]]) - mean(a.sem[sems[0]])).toFixed(6)) : 0
    };
    s.subject_marks_summary = {
      failed_subjects_count: s.marks_features.failed_subjects_count,
      core_theory_average: s.marks_features.core_theory_average
    };
  }
}

async function loadDemoStudents() {
  if (cachedDemoStudents) return cachedDemoStudents;

  if (!fs.existsSync(DATA_PATH)) {
    return [];
  }

  const fileStream = fs.createReadStream(DATA_PATH, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let headers = null;
  const highRisk = [];
  const medRisk = [];
  const lowRisk = [];

    let targetStudent = null;
    for await (const line of rl) {
      if (!line.trim()) continue;
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''));
      if (!headers) {
        headers = cols;
        continue;
      }

      const row = {};
      headers.forEach((h, i) => { row[h] = cols[i]; });

      let trend = [];
      try {
        trend = JSON.parse(row.monthly_attendance_trend || '[]');
      } catch (parseErr) {
        console.warn(`[DemoController] Could not parse trend for ${row.student_id}:`, parseErr.message);
        trend = [];
      }

      const studentObj = {
        student_id: row.student_id,
        student_name: row.student_name,
        college_id: row.college_id,
        college_name: row.college_name,
        department: row.department,
        year_of_study: Number(row.year_of_study),
        attendance_pct: Number(row.attendance_pct),
        monthly_attendance_trend: trend,
        overall_gpa: Number(row.overall_gpa),
        backlogs_count: Number(row.backlogs_count),
        cutoff_mark_200: Number(row.cutoff_mark_200),
        mentor_meetings_attended: Number(row.mentor_meetings_attended),
        family_income_annual: Number(row.family_income_annual),
        first_gen_learner: Number(row.first_gen_learner),
        distance_from_home_km: Number(row.distance_from_home_km),
        home_state: row.home_state,
        board_of_education: row.board_of_education,
        admission_quota: row.admission_quota,
        dropout_risk_label: row.dropout_risk_label,
        dropout_risk_score: Number(row.dropout_risk_score),
      };

      if (row.student_id === 'STU_MIST_IT_Y3_5559') {
        targetStudent = studentObj;
      } else if (row.dropout_risk_label === 'High' && highRisk.length < 10) {
        highRisk.push(studentObj);
      } else if (row.dropout_risk_label === 'Medium' && medRisk.length < 10) {
        medRisk.push(studentObj);
      } else if (row.dropout_risk_label === 'Low' && lowRisk.length < 10) {
        lowRisk.push(studentObj);
      }

      if (highRisk.length >= 10 && medRisk.length >= 10 && lowRisk.length >= 10 && targetStudent) {
        break;
      }
    }

    if (targetStudent && !highRisk.some(s => s.student_id === targetStudent.student_id)) {
      highRisk.unshift(targetStudent);
    }

  const chosen = [...highRisk, ...medRisk, ...lowRisk];
  await attachMarksFeatures(chosen);
  cachedDemoStudents = chosen;
  return cachedDemoStudents;
}

exports.getDemoStudents = async (req, res) => {
  try {
    const list = await loadDemoStudents();
    return res.json({
      total: list.length,
      data: list
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load demo students', details: err.message });
  }
};

exports.findDemoStudentById = async (studentId) => {
  if (!studentId) return null;
  const list = await loadDemoStudents();
  return list.find(s => s.student_id === studentId) || null;
};

