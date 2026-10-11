const express = require('express');
const router = express.Router();

const predictController = require('../controllers/predictController');
const chatController = require('../controllers/chatController');
const demoController = require('../controllers/demoController');
const metricsController = require('../controllers/metricsController');
const mlServiceClient = require('../services/mlServiceClient');
const { getDBStatus } = require('../config/db');

const { apiKeyAuth, requireApiKeyOnly, createSessionToken } = require('../middleware/auth');
const { validatePredictPayload, validateChatPayload } = require('../middleware/validation');
const { strictLimiter, sessionTokenLimiter } = require('../middleware/rateLimiter');

// --- 1. Public Endpoints (Serving Standalone UI without credentials) ---

// Health & System Status Check (always public)
router.get('/health', async (req, res) => {
  const mlHealth = await mlServiceClient.checkHealth();
  res.json({
    status: 'healthy',
    system: 'AI-Powered Student Dropout Prediction and Intervention System',
    backend: 'Express 4.x running on port ' + (process.env.PORT || 5001),
    database: getDBStatus() ? 'MongoDB Atlas Connected' : 'Offline Mode',
    ml_microservice: mlHealth,
    timestamp: new Date().toISOString()
  });
});

// Evaluation Metrics API (Public benchmark results)
router.get('/metrics', metricsController.getMetrics);

// Demo Students for "Try a Prediction" Sandbox (Public sample dataset)
router.get('/students/demo', demoController.getDemoStudents);

// Issue Short-Lived Session Token for Standalone Frontend (Allowed origins only)
router.get('/session-token', sessionTokenLimiter, (req, res) => {
  const origin = req.headers.origin || req.headers.referer;
  const configuredOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : [];

  if (!origin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Origin or Referer header is required for session token issuance.'
    });
  }

  let reqOrigin = origin;
  try {
    reqOrigin = new URL(origin).origin;
  } catch (e) {
    // Keep raw string
  }

  const isAllowed = configuredOrigins.some(allowed => {
    try {
      return new URL(allowed).origin === reqOrigin;
    } catch {
      return allowed === reqOrigin;
    }
  });

  if (!isAllowed) {
    return res.status(403).json({
      error: 'Forbidden',
      message: `Origin '${origin}' is not authorized to request session tokens.`
    });
  }

  try {
    const token = createSessionToken();
    res.json({
      token,
      expires_in: 900, // 15 minutes
      scope: ['predict', 'chat'],
      type: 'Bearer'
    });
  } catch (err) {
    console.error('[Session Token Generation Error]', err.message);
    res.status(500).json({ error: 'Failed to generate session token' });
  }
});

// --- 2. Protected Endpoints (Require X-API-Key or valid Session Token) ---

// Prediction API (Validated, Rate-limited, Protected)
router.post(
  '/predict',
  strictLimiter,
  apiKeyAuth,
  validatePredictPayload,
  predictController.predictRisk
);

// Intervention Chatbot (Validated, Rate-limited, Protected)
router.post(
  '/chat',
  strictLimiter,
  apiKeyAuth,
  validateChatPayload,
  chatController.handleChat
);

// Sensitive Meeting Requests Log (Protected: strictly requires X-API-Key)
router.get(
  '/meetings',
  requireApiKeyOnly,
  chatController.getMeetings
);

module.exports = router;
