import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');

console.log('======================================================');
console.log('🎨  STYLE FREEZE GUARD');
console.log('Comparing working tree style changes with pre-round3...');
console.log('======================================================\n');

// Allowed existing color variables
const ALLOWED_VARS = new Set([
  '--bg',
  '--bg-accent',
  '--ink',
  '--ink-on-dark',
  '--surface',
  '--star',
  '--radius',
  '--radius-input',
  '--risk-low',
  '--risk-med',
  '--risk-high',
  '--alert-bg',
  '--alert-ink',
  '--focus',
  '--font-family',
  '--px',
  '--py',
  '--sy'
]);

let diff = '';
try {
  diff = execSync('git diff pre-round3 -- "src/**"', {
    cwd: frontendDir,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
} catch (err) {
  // Try with frontend/ prefix if running from root
  try {
    diff = execSync('git diff pre-round3 -- "frontend/src/**"', {
      cwd: frontendDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (e) {
    console.error('Failed to get git diff against pre-round3:', e.message);
    process.exit(1);
  }
}

if (!diff.trim()) {
  console.log('  ✓ No style diff detected against pre-round3.');
  console.log('\n======================================================');
  console.log('✅ Style Guard: All style checks PASSED.');
  console.log('======================================================\n');
  process.exit(0);
}

const lines = diff.split('\n');
let hasError = false;

// Regex for unauthorized color literals (#hex, rgb, rgba, hsl, hsla)
// Ignore common benign non-color words, comments, etc.
const colorLiteralRegex = /#([0-9a-fA-F]{3,8})\b|rgba?\([^)]+\)|hsla?\([^)]+\)/g;

// Regex for var(--...) usage
const cssVarRegex = /var\((--[a-zA-Z0-9_-]+)\)/g;

let currentFile = '';

for (const line of lines) {
  if (line.startsWith('+++ b/')) {
    currentFile = line.replace('+++ b/', '').trim();
    continue;
  }

  // Only check added lines
  if (!line.startsWith('+') || line.startsWith('+++')) {
    continue;
  }

  const addedCode = line.slice(1).trim();

  // Skip comments
  if (addedCode.startsWith('//') || addedCode.startsWith('/*') || addedCode.startsWith('*')) {
    continue;
  }

  // Check for newly introduced color literals
  const colorMatches = addedCode.match(colorLiteralRegex);
  if (colorMatches) {
    for (const match of colorMatches) {
      // Ignore allowed svg namespaces or common hashes if any
      console.error(`  ✗ FAIL [${currentFile}]: Newly added color literal "${match}" detected.`);
      console.error(`    ↳ Line: ${addedCode}`);
      hasError = true;
    }
  }

  // Check for newly introduced CSS variables that are not in ALLOWED_VARS
  let varMatch;
  while ((varMatch = cssVarRegex.exec(addedCode)) !== null) {
    const varName = varMatch[1];
    if (!ALLOWED_VARS.has(varName)) {
      console.error(`  ✗ FAIL [${currentFile}]: Unauthorized CSS variable "${varName}" detected.`);
      console.error(`    ↳ Line: ${addedCode}`);
      hasError = true;
    }
  }
}

if (hasError) {
  console.log('\n======================================================');
  console.log('❌ Style Guard: Style freeze violations detected!');
  console.log('======================================================\n');
  process.exit(1);
} else {
  console.log('  ✓ PASS: All additions adhere strictly to existing tokens and palette.');
  console.log('\n======================================================');
  console.log('✅ Style Guard: All style checks PASSED.');
  console.log('======================================================\n');
  process.exit(0);
}
