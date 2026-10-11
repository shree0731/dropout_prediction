const rateLimit = require('express-rate-limit');

// General API Rate Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

// Stricter Rate Limiter for compute/LLM endpoints (/predict and /chat)
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded for prediction/chat operations. Please wait 1 minute.'
  }
});

// Dedicated Rate Limiter for Session Token Issuance (20 tokens per hour per IP)
const sessionTokenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 tokens per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded for session token generation. Limit is 20 tokens per hour.'
  }
});

module.exports = {
  generalLimiter,
  strictLimiter,
  sessionTokenLimiter
};

