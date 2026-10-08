const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DATA_PATH = path.join(__dirname, '../../data/students.csv');
let cachedDemoStudents = null;

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
      subject_marks_summary: {
        failed_subjects_count: Number(row.backlogs_count),
        core_theory_average: Number(row.overall_gpa) > 7 ? 68.5 : Number(row.overall_gpa) > 5.5 ? 52.0 : 42.5
      }
    };

    if (row.dropout_risk_label === 'High' && highRisk.length < 10) {
      highRisk.push(studentObj);
    } else if (row.dropout_risk_label === 'Medium' && medRisk.length < 10) {
      medRisk.push(studentObj);
    } else if (row.dropout_risk_label === 'Low' && lowRisk.length < 10) {
      lowRisk.push(studentObj);
    }

    if (highRisk.length >= 10 && medRisk.length >= 10 && lowRisk.length >= 10) {
      break;
    }
  }

  cachedDemoStudents = [...highRisk, ...medRisk, ...lowRisk];
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
