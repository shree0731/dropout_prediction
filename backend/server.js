/**
 * Express Backend Server for Standalone AI Dropout Prediction & Intervention System
 * Hardened REST Gateway interfacing with FastAPI ML Engine
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { connectDB } = require('./config/db');
const { generalLimiter } = require('./middleware/rateLimiter');
const apiRoutes = require('./routes/api');

const { checkEnv } = require('./scripts/check-env');

// Configuration assertion: Refuse to start if critical security env vars are missing
function assertConfig() {
  const result = checkEnv(process.env, { exitOnError: process.env.NODE_ENV !== 'test', silent: false });
  if (!result.valid) {
    throw new Error(`FATAL SECURITY ERROR: AI Gateway configuration invalid: ${result.errors.join('; ')}`);
  }
}

// Run assertion check on load
assertConfig();

const app = express();
const PORT = process.env.PORT || 5001;

// C3. Proxy awareness: set Express trust proxy from env var (default 1 in production)
const trustProxyVal = process.env.TRUST_PROXY !== undefined
  ? (process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1' ? 1 : (isNaN(Number(process.env.TRUST_PROXY)) ? process.env.TRUST_PROXY : Number(process.env.TRUST_PROXY)))
  : (process.env.NODE_ENV === 'production' ? 1 : false);
app.set('trust proxy', trustProxyVal);

// 1. Security Headers via Helmet
app.use(helmet());

// 2. CORS Allowlist Configuration (C2)
const rawCors = process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5000';
const configuredOrigins = rawCors.split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser server-to-server requests or same-origin
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV === 'production' && configuredOrigins.includes('*')) {
      const corsErr = new Error('CORS violation: Wildcard origin is forbidden in production.');
      corsErr.status = 403;
      return callback(corsErr);
    }
    if (configuredOrigins.includes(origin)) {
      return callback(null, true);
    }
    const corsErr = new Error(`CORS policy violation: Origin '${origin}' is not in allowed origins list.`);
    corsErr.status = 403;
    return callback(corsErr);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Session-Token']
}));

// C6. Direct root health check (no auth)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-dropout-prediction-gateway',
    timestamp: new Date().toISOString()
  });
});


// 3. Body Parsing with strict size limit (100kb)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// 4. Rate Limiting
app.use(generalLimiter);

// 5. Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// 6. Mount REST API Routes
app.use('/api', apiRoutes);

// Root Status Endpoint
app.get('/', (req, res) => {
  res.json({
    title: 'AI-Powered Student Dropout Prediction & Academic Intervention System',
    architecture: 'Express/MongoDB Gateway + Internal Python FastAPI ML Engine',
    documentation: '/docs/security.md',
    endpoints: {
      health: 'GET /api/health (public)',
      metrics: 'GET /api/metrics (public)',
      demoStudents: 'GET /api/students/demo (public)',
      sessionToken: 'GET /api/session-token (public for allowed origins)',
      predict: 'POST /api/predict (protected: X-API-Key or Session Token)',
      chat: 'POST /api/chat (protected: X-API-Key or Session Token)',
      meetings: 'GET /api/meetings (protected: X-API-Key)'
    }
  });
});

// 7. Error handling middleware: Log detailed errors internally, send generic messages to client
app.use((err, req, res, next) => {
  console.error('[Server Unhandled Error]', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  if (err.message && err.message.includes('CORS policy violation')) {
    return res.status(403).json({ error: 'Forbidden', message: 'Origin not allowed by CORS policy' });
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 403 ? 'Forbidden' : 'Internal Server Error',
    message: statusCode === 403 ? err.message : 'An unexpected server error occurred.'
  });
});

const startServer = async () => {
  try {
    assertConfig();
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`================================================================`);
      console.log(`✓ AI Dropout Prediction Express API running on http://localhost:${PORT}`);
      console.log(`✓ Protected Endpoints secured with fail-closed authentication`);
      console.log(`================================================================`);
    });
    return server;
  } catch (err) {
    console.error('[Fatal Startup Error]', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.assertConfig = assertConfig;
module.exports.startServer = startServer;
