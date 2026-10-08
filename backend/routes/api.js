const express = require('express');
const router = express.Router();

const predictController = require('../controllers/predictController');
const chatController = require('../controllers/chatController');
const demoController = require('../controllers/demoController');
const metricsController = require('../controllers/metricsController');
const mlServiceClient = require('../services/mlServiceClient');
const { getDBStatus } = require('../config/db');

const { apiKeyAuth, createSessionToken } = require('../middleware/auth');
const { validatePredictPayload, validateChatPayload } = require('../middleware/validation');
const { strictLimiter } = require('../middleware/rateLimiter');

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

// Issue Short-Lived Session Token for Standalone Frontend (Same-origin or allowed origins)
router.get('/session-token', (req, res) => {
  try {
    const token = createSessionToken();
    res.json({
      token,
      expires_in: 900, // 15 minutes
      type: 'Bearer'
    });
  } catch (err) {
    console.error('[Session Token Generation Error]', err);
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
  apiKeyAuth,
  chatController.getMeetings
);

module.exports = router;
