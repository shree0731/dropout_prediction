/**
 * AI Dropout Prediction Microservice Environment Integrity Checker
 * Verifies that all required environment variables are present, sufficiently secure,
 * and not set to insecure default placeholders.
 */

const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend root if not already loaded
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const FORBIDDEN_PLACEHOLDER_SUBSTRINGS = [
  'change_me',
  'changeme',
  'your_jwt_secret',
  'your_secret',
  'replace_with_',
  'replace_me',
  'example',
  'default_key',
  'secret123'
];

function isPlaceholder(val) {
  if (typeof val !== 'string') return true;
  const lower = val.toLowerCase().trim();
  return FORBIDDEN_PLACEHOLDER_SUBSTRINGS.some(ph => lower.includes(ph));
}

function checkEnv(env = process.env, options = { exitOnError: true, silent: false }) {
  const errors = [];

  // 1. MONGO_URI
  if (!env.MONGO_URI || !env.MONGO_URI.trim()) {
    errors.push('MONGO_URI is missing or empty.');
  } else if (!env.MONGO_URI.startsWith('mongodb://') && !env.MONGO_URI.startsWith('mongodb+srv://')) {
    errors.push('MONGO_URI must be a valid connection string starting with mongodb:// or mongodb+srv://');
  } else {
    const dbMatch = env.MONGO_URI.match(/\/([^/?]+)(\?|$)/);
    const dbName = dbMatch ? dbMatch[1] : '';
    if (dbName === 'student_dropout_erp') {
      errors.push("MONGO_URI cannot point to 'student_dropout_erp'. AI backend must use separate database 'ai_dropout_prediction'.");
    }
  }

  // 1b. APP_DB_ROLE
  if (env.APP_DB_ROLE && env.APP_DB_ROLE !== 'ai') {
    errors.push(`APP_DB_ROLE must be 'ai' for AI Dropout Prediction backend (found: '${env.APP_DB_ROLE}').`);
  }

  // 2. API_KEY (Service-to-service key for ERP <-> AI Gateway)
  if (!env.API_KEY || !env.API_KEY.trim()) {
    errors.push('API_KEY is required and cannot be empty.');
  } else if (env.API_KEY.length < 32) {
    errors.push(`API_KEY must be at least 32 characters long (current length: ${env.API_KEY.length}).`);
  } else if (isPlaceholder(env.API_KEY)) {
    errors.push('API_KEY contains an insecure placeholder phrase.');
  }

  // 3. SESSION_SECRET (Dedicated key for browser session tokens)
  if (!env.SESSION_SECRET || !env.SESSION_SECRET.trim()) {
    errors.push('SESSION_SECRET is required and cannot be empty.');
  } else if (env.SESSION_SECRET.length < 32) {
    errors.push(`SESSION_SECRET must be at least 32 characters long (current length: ${env.SESSION_SECRET.length}).`);
  } else if (isPlaceholder(env.SESSION_SECRET)) {
    errors.push('SESSION_SECRET contains an insecure placeholder phrase.');
  } else if (env.API_KEY && env.SESSION_SECRET === env.API_KEY) {
    errors.push('SESSION_SECRET cannot equal API_KEY. Browser session tokens must use a distinct signing secret from the service API_KEY.');
  }

  // 4. CORS_ORIGINS / ALLOWED_ORIGINS
  const corsOrigins = env.CORS_ORIGINS || env.ALLOWED_ORIGINS;
  if (!corsOrigins || !corsOrigins.trim()) {
    errors.push('CORS_ORIGINS (or ALLOWED_ORIGINS) is missing (e.g. http://localhost:5173,http://localhost:5174,http://localhost:3000).');
  }


  // 5. ML_SERVICE_URL
  if (!env.ML_SERVICE_URL || !env.ML_SERVICE_URL.trim()) {
    errors.push('ML_SERVICE_URL is missing (e.g. http://localhost:8001 or http://127.0.0.1:8001).');
  } else if (!/^https?:\/\//i.test(env.ML_SERVICE_URL)) {
    errors.push('ML_SERVICE_URL must be a valid HTTP/HTTPS URL.');
  }

  // 6. ERP_BASE_URL
  if (!env.ERP_BASE_URL || !env.ERP_BASE_URL.trim()) {
    errors.push('ERP_BASE_URL is missing (e.g. http://localhost:5000).');
  } else if (!/^https?:\/\//i.test(env.ERP_BASE_URL)) {
    errors.push('ERP_BASE_URL must be a valid HTTP/HTTPS URL.');
  }

  // 7. ERP_SERVICE_API_KEY
  if (!env.ERP_SERVICE_API_KEY || !env.ERP_SERVICE_API_KEY.trim()) {
    errors.push('ERP_SERVICE_API_KEY is required to deliver meeting requests to the ERP backend.');
  } else if (env.ERP_SERVICE_API_KEY.length < 32) {
    errors.push(`ERP_SERVICE_API_KEY must be at least 32 characters long (current length: ${env.ERP_SERVICE_API_KEY.length}).`);
  } else if (isPlaceholder(env.ERP_SERVICE_API_KEY)) {
    errors.push('ERP_SERVICE_API_KEY contains an insecure placeholder phrase.');
  }

  // 8. MODEL_DIR
  if (!env.MODEL_DIR || !env.MODEL_DIR.trim()) {
    errors.push('MODEL_DIR is missing (e.g. ../models).');
  }

  // 9. Optional GEMINI_API_KEY placeholder validation
  if (env.GEMINI_API_KEY && isPlaceholder(env.GEMINI_API_KEY)) {
    errors.push('GEMINI_API_KEY contains a placeholder phrase. Either remove it for local fallback or provide a real key.');
  }

  const isValid = errors.length === 0;

  if (!isValid && !options.silent) {
    console.error('\n' + '='.repeat(80));
    console.error('CRITICAL CONFIGURATION ERROR (AI Dropout Prediction Gateway)');
    console.error('='.repeat(80));
    console.error('The server cannot start due to missing or insecure environment configuration:');
    errors.forEach(err => console.error(`  - ${err}`));
    console.error('\nTo generate cryptographically secure 32-byte secrets, run:');
    console.error('  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    console.error('\nCopy .env.example to .env and configure all required variables before starting.');
    console.error('='.repeat(80) + '\n');
  }

  if (!isValid && options.exitOnError) {
    process.exit(1);
  }

  return { valid: isValid, errors };
}

if (require.main === module) {
  checkEnv(process.env, { exitOnError: true, silent: false });
  console.log('✓ AI Dropout Prediction environment configuration verified successfully.');
}

module.exports = {
  checkEnv,
  FORBIDDEN_PLACEHOLDER_SUBSTRINGS
};
