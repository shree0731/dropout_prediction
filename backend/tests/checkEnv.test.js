const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { checkEnv } = require('../scripts/check-env');

describe('AI Dropout Prediction Gateway Environment Integrity (check-env.js)', () => {
  const envExamplePath = path.resolve(__dirname, '..', '.env.example');

  test('asserts all required keys exist in .env.example', () => {
    expect(fs.existsSync(envExamplePath)).toBe(true);
    const content = fs.readFileSync(envExamplePath, 'utf8');
    const parsed = dotenv.parse(content);

    const requiredKeys = [
      'PORT',
      'API_KEY',
      'SESSION_SECRET',
      'ALLOWED_ORIGINS',
      'MONGO_URI',
      'ML_SERVICE_URL',
      'ERP_BASE_URL',
      'ERP_SERVICE_API_KEY',
      'MODEL_DIR'
    ];

    requiredKeys.forEach(key => {
      expect(parsed).toHaveProperty(key);
      expect(parsed[key]).toBeTruthy();
    });
  });

  test('fails validation when env is completely empty', () => {
    const result = checkEnv({}, { exitOnError: false, silent: true });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(7);
    expect(result.errors.some(e => e.includes('MONGO_URI'))).toBe(true);
    expect(result.errors.some(e => e.includes('API_KEY'))).toBe(true);
    expect(result.errors.some(e => e.includes('SESSION_SECRET'))).toBe(true);
    expect(result.errors.some(e => e.includes('ERP_SERVICE_API_KEY'))).toBe(true);
  });

  test('refuses boot if SESSION_SECRET is equal to API_KEY', () => {
    const identicalKeysEnv = {
      MONGO_URI: 'mongodb://localhost:27017/test_db',
      API_KEY: 'shared_key_length_greater_than_32_characters_long_123',
      SESSION_SECRET: 'shared_key_length_greater_than_32_characters_long_123',
      ALLOWED_ORIGINS: 'http://localhost:5173',
      ML_SERVICE_URL: 'http://localhost:8001',
      ERP_BASE_URL: 'http://localhost:5000',
      ERP_SERVICE_API_KEY: 'erp_key_length_greater_than_32_characters_long_123',
      MODEL_DIR: '../models'
    };

    const result = checkEnv(identicalKeysEnv, { exitOnError: false, silent: true });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('SESSION_SECRET cannot equal API_KEY'))).toBe(true);
  });

  test('fails when secrets contain forbidden placeholders', () => {
    const placeholderEnv = {
      MONGO_URI: 'mongodb://localhost:27017/test_db',
      API_KEY: 'replace_with_shared_service_api_key_at_least_32_chars',
      SESSION_SECRET: 'valid_distinct_session_secret_32_characters_long',
      ALLOWED_ORIGINS: 'http://localhost:5173',
      ML_SERVICE_URL: 'http://localhost:8001',
      ERP_BASE_URL: 'http://localhost:5000',
      ERP_SERVICE_API_KEY: 'erp_key_length_greater_than_32_characters_long_123',
      MODEL_DIR: '../models'
    };

    const result = checkEnv(placeholderEnv, { exitOnError: false, silent: true });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('API_KEY contains an insecure placeholder'))).toBe(true);
  });

  test('succeeds with fully compliant production environment config', () => {
    const validEnv = {
      MONGO_URI: 'mongodb://localhost:27017/production_db',
      API_KEY: 'sec_f84b1e92d7c04a3e819a6d4e2c71095b',
      SESSION_SECRET: 'ses_a7d3b91c0e4f5286194b3c82d01e749a',
      ALLOWED_ORIGINS: 'http://localhost:5173,http://localhost:5174,http://localhost:3000',
      ML_SERVICE_URL: 'http://localhost:8001',
      ERP_BASE_URL: 'http://localhost:5000',
      ERP_SERVICE_API_KEY: 'erp_srv_9c18d4e7f603a152b820e981c472d03a',
      MODEL_DIR: '../models'
    };

    const result = checkEnv(validEnv, { exitOnError: false, silent: true });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
