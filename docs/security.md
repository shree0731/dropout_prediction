# Security Architecture & Threat Model: AI Dropout Prediction Microservice

## 1. Authentication & Service Access Model
The AI Dropout Prediction microservice operates both as an internal inference provider for InSightERP and as a standalone analysis application.

### Public vs Protected Endpoints
- **Public Routes**:
  - `GET /api/health` — Liveness & uptime probe.
  - `GET /api/metrics` — Aggregate model evaluation benchmarks & SHAP summary.
  - `GET /api/students/demo` — Sanitized demo student records for offline exploration.
  - `GET /api/session-token` — Short-lived, time-bounded session tokens enabling the standalone frontend to interact without exposing master API keys.
- **Protected Routes**:
  - `POST /api/predict` — XGBoost model inference & SHAP driver extraction.
  - `POST /api/chat` — Empathetic advisor & distress escalation.
  - `GET /api/meetings` — Student counseling and meeting escalation logs.

### Fail-Closed API Key Verification
- Authentication is enforced via the `X-API-Key` HTTP header.
- Verification uses `crypto.timingSafeEqual` with strict length guards to eliminate timing-attack vulnerabilities.
- **Fail-Closed Boot Guard**: If `API_KEY` is undefined or empty, the server **refuses to start** and terminates execution with code 1.

---

## 2. Threat Model Summary

| Threat Scenario | Attacker Profile | Vector | Security Control | Result |
|---|---|---|---|---|
| **Unauthorized Prediction Snooping** | External Client | `POST /api/predict` without key | `apiKeyAuth` middleware | `401 Unauthorized` |
| **Timing Attack on API Key** | Network Adversary | Side-channel timing measurement | `crypto.timingSafeEqual` over fixed-length buffer hashes | Uniform comparison duration |
| **Cross-Origin API Abuse** | Malicious Website | Cross-site `fetch` request | CORS origin check against `ALLOWED_ORIGINS` | `403 Forbidden` / Disallowed origin |
| **Sensitive Log Harvesting** | Unauthorized Client | `GET /api/meetings` | Route-level key requirement | `401 Unauthorized` |
| **Payload Injection / Overload** | Malicious Client | Massive body payload | `express.json({ limit: '100kb' })` + Zod schema validation | `413 Payload Too Large` / `422 Unprocessable Entity` |
| **Bot Scraping / DoS** | Automated Scraper | Burst traffic on `/chat` and `/predict` | `express-rate-limit` (strict limiter: 30 requests/15 min) | `429 Too Many Requests` |

---

## 3. Defense-in-Depth Hardening Controls
1. **HTTP Security Headers**: `helmet` is enabled on all routes (HSTS, frameguard, CSP, noSniff).
2. **Schema & Range Validation**: Zod middleware strictly checks data types and physical boundaries (GPA 0.0-10.0, Attendance 0.0-100.0%, allowed departments allowlist).
3. **Chatbot Safety & Honesty Invariant**:
   - The chatbot never falsely promises that a counselor has been notified unless a `MeetingRequest` record was successfully committed to MongoDB.
   - If the database is offline or write fails, the bot explicitly reports the outage and provides direct emergency helplines (Tele-MANAS: 14416, KIRAN: 1800-599-0019) without making unkept promises.
4. **Mandatory Disclaimer**: Every conversational response includes an explicit disclaimer: *"AI academic assistant. Not a substitute for professional counseling or official academic advice."*

---

## 4. Secret Hygiene
- All sensitive tokens and keys are loaded via environment variables (`.env`).
- Version control excludes secret files (`.gitignore` specifies `*.env`, `.env`, `db.txt`, `*.key`, `*.pem`).
- Only sanitized `.env.example` templates are tracked.
