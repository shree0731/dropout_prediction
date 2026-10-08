const crypto = require('crypto');

/**
 * Compare two strings using timing-safe comparison to prevent timing attacks.
 */
function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Fail-closed API Key Middleware.
 * Rejects requests with missing or invalid X-API-Key with 401.
 * Also supports short-lived session token via Authorization: Bearer <token> for browser clients.
 */
const apiKeyAuth = (req, res, next) => {
  const configuredApiKey = process.env.API_KEY;

  if (!configuredApiKey || !configuredApiKey.trim()) {
    console.error('[Security Critical] API_KEY environment variable is not configured');
    return res.status(500).json({ error: 'Server authentication misconfiguration' });
  }

  // 1. Check X-API-Key header
  const providedKey = req.headers['x-api-key'];
  if (providedKey) {
    if (timingSafeEqualStr(providedKey, configuredApiKey)) {
      req.authType = 'api-key';
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid X-API-Key' });
  }

  // 2. Check Authorization Bearer header (session token for frontend)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const sessionSecret = process.env.SESSION_SECRET || configuredApiKey;
    try {
      const [payloadB64, sig] = token.split('.');
      if (payloadB64 && sig) {
        const expectedSig = crypto.createHmac('sha256', sessionSecret).update(payloadB64).digest('base64url');
        if (timingSafeEqualStr(sig, expectedSig)) {
          const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
          if (payload.exp && Date.now() < payload.exp) {
            req.authType = 'session-token';
            req.sessionPayload = payload;
            return next();
          }
        }
      }
    } catch (e) {
      console.warn('[Auth Middleware] Session token decode failure:', e.message);
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session token' });
  }

  // Fail closed if no credentials provided
  return res.status(401).json({ error: 'Unauthorized: Missing required X-API-Key or Authorization header' });
};

/**
 * Generate a short-lived session token (15 mins) for allowed frontend origins.
 */
function createSessionToken() {
  const configuredApiKey = process.env.API_KEY || 'default_key';
  const sessionSecret = process.env.SESSION_SECRET || configuredApiKey;
  const payload = {
    sub: 'frontend-client',
    iat: Date.now(),
    exp: Date.now() + 15 * 60 * 1000 // 15 minutes
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', sessionSecret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

module.exports = {
  apiKeyAuth,
  timingSafeEqualStr,
  createSessionToken
};
