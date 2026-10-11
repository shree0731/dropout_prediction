const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'counselling.json');
const EXAMPLE_CONFIG_PATH = path.join(__dirname, '..', 'config', 'counselling.example.json');

function loadCounsellingConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (e) {
      console.warn('[CounsellingConfig] Failed to parse counselling.json, falling back to example:', e.message);
    }
  }
  if (fs.existsSync(EXAMPLE_CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(EXAMPLE_CONFIG_PATH, 'utf8'));
    } catch (e) {
      console.error('[CounsellingConfig] Failed to parse counselling.example.json:', e.message);
    }
  }
  return {};
}

/**
 * Resolve counselling contact for a given college_id.
 *
 * Rules:
 * - If an entry exists (or default exists):
 *     - If is_demo is true, append "(demo contact)" to displayed email.
 *     - If phone is null, NEVER display any phone number.
 * - If no entry and no default (or no valid contacts):
 *     - Show NO email or phone; advise student to contact their mentor or college counselling centre directly.
 * - Never claim a specific named person will respond.
 */
function resolveCounsellingContact(collegeId, customConfig = null) {
  const config = customConfig || loadCounsellingConfig();
  const entry = (collegeId && config[collegeId]) || config.default || null;

  if (!entry) {
    return {
      hasContact: false,
      deskName: 'Campus Student Counselling Centre',
      contactDetails: null,
      displayText: 'reach out directly to your faculty mentor or visit the campus student counselling centre'
    };
  }

  const parts = [];
  const deskName = entry.desk_name || 'Student Counselling Desk';

  let emailText = null;
  if (entry.email) {
    emailText = entry.is_demo ? `${entry.email} (demo contact)` : entry.email;
    parts.push(`Email: ${emailText}`);
  }

  let phoneText = null;
  if (entry.phone) {
    phoneText = entry.phone;
    parts.push(`Phone: ${phoneText}`);
  }

  if (entry.hours) {
    parts.push(`Hours: ${entry.hours}`);
  }

  const contactDetails = parts.join(' | ');

  if (parts.length === 0) {
    return {
      hasContact: false,
      deskName,
      contactDetails: null,
      displayText: `reach out directly to the ${deskName} or your assigned faculty mentor`
    };
  }

  return {
    hasContact: true,
    deskName,
    email: emailText,
    phone: phoneText,
    isDemo: !!entry.is_demo,
    contactDetails,
    displayText: `${deskName} (${contactDetails})`
  };
}

module.exports = {
  loadCounsellingConfig,
  resolveCounsellingContact
};
