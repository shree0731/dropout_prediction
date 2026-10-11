const path = require('path');
const fs = require('fs');
const { resolveCounsellingContact } = require('../utils/counsellingConfig');
const {
  formatHelplinesText,
  TELE_MANAS_NUMBER,
  KIRAN_NUMBER,
  STATUS_NOTICE
} = require('../constants/helplines');

describe('Task 1 — Counselling Contact Configuration & Safety Verification', () => {

  test('Grep source tree: no forbidden hardcoded email or phone literals exist outside config/helplines', () => {
    const forbiddenPatterns = [
      'counselor@institution.edu',
      '+91-44-2223-1111',
      'counselor@institution'
    ];

    const projectRoot = path.resolve(__dirname, '..', '..');
    const checkedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.json'];

    function scanDir(dir, fileList = []) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (['node_modules', '.git', '__pycache__', '.pytest_cache', 'dist', 'build'].includes(item)) {
          continue;
        }
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath, fileList);
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (checkedExtensions.includes(ext)) {
            fileList.push(fullPath);
          }
        }
      }
      return fileList;
    }

    const allFiles = scanDir(projectRoot);
    const violations = [];

    for (const filePath of allFiles) {
      // Allowed paths: config files or test files verifying the forbidden strings
      const relative = path.relative(projectRoot, filePath).replace(/\\/g, '/');
      if (relative.includes('counsellingConfig.test.js')) continue;

      const content = fs.readFileSync(filePath, 'utf8');
      for (const pat of forbiddenPatterns) {
        if (content.includes(pat)) {
          violations.push({ file: relative, pattern: pat });
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test('Shipped config: contains demo email, appends "(demo contact)", and contains NO phone number', () => {
    const res = resolveCounsellingContact('default');
    expect(res.hasContact).toBe(true);
    expect(res.email).toContain('grouppresentation785@gmail.com');
    expect(res.email).toContain('(demo contact)');
    expect(res.phone).toBeNull();
    expect(res.displayText).toContain('grouppresentation785@gmail.com (demo contact)');
    expect(res.displayText).not.toMatch(/Phone:/i);
    expect(res.displayText).not.toMatch(/\+91/);
  });

  test('Fallback when no entry and no default: shows NO email or phone and directs to mentor or centre directly', () => {
    const emptyConfig = {};
    const res = resolveCounsellingContact('NON_EXISTENT_COLLEGE', emptyConfig);
    expect(res.hasContact).toBe(false);
    expect(res.displayText).toMatch(/reach out directly to your faculty mentor or visit the campus student counselling centre/i);
    expect(res.displayText).not.toMatch(/@/);
    expect(res.displayText).not.toMatch(/\+91/);
  });

  test('Specific college entry with is_demo: false and phone displays phone without demo badge', () => {
    const customConfig = {
      C101: {
        desk_name: 'Apex Student Support Desk',
        email: 'wellness@apex.edu',
        phone: '+91-422-2574071',
        is_demo: false
      }
    };
    const res = resolveCounsellingContact('C101', customConfig);
    expect(res.hasContact).toBe(true);
    expect(res.email).toBe('wellness@apex.edu');
    expect(res.email).not.toContain('(demo contact)');
    expect(res.phone).toBe('+91-422-2574071');
    expect(res.displayText).toContain('wellness@apex.edu');
    expect(res.displayText).toContain('+91-422-2574071');
  });

  test('Crisis reply constants contain both Tele-MANAS (14416) and KIRAN (1800-599-0019) with status marker', () => {
    const helplinesText = formatHelplinesText();
    expect(helplinesText).toContain(TELE_MANAS_NUMBER);
    expect(helplinesText).toContain(KIRAN_NUMBER);
    expect(helplinesText).toContain('Tele-MANAS');
    expect(helplinesText).toContain('KIRAN');
    expect(helplinesText).toContain(STATUS_NOTICE);
    expect(STATUS_NOTICE).toBe('unverified – owner to confirm');
  });

  test('Never claims a specific named person will respond', () => {
    const res = resolveCounsellingContact('default');
    expect(res.displayText).not.toMatch(/Dr\.|Prof\.|Mr\.|Mrs\.|Ms\./i);
  });

  test('In production mode, [unverified – owner to confirm] is excluded from student-facing replies', () => {
    const origEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const text = formatHelplinesText();
      expect(text).not.toContain('unverified – owner to confirm');
      expect(text).toContain(TELE_MANAS_NUMBER);
      expect(text).toContain(KIRAN_NUMBER);
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });
});
