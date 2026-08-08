# Rules

## Security
- **No hardcoded keys ever.** All secrets via `pydantic-settings` from `.env` or environment. `constants.py` must NOT contain production keys.
- **CORS:** explicit allowlist from `Settings.CORS_ORIGINS` — never `"*"`.
- **Gemini keys stay server-side only.** Never expose them in the frontend bundle.
- **Passwords:** bcrypt via `passlib` (`bcrypt` scheme). Never plaintext. Never logged.
- **Purge secrets from git history** using `git filter-repo` or BFG — deleting the current file is not enough.

## SDK / Dependencies
- **Gemini SDK:** Use `google-genai` (unified), NOT the deprecated `google.generativeai` package.
- **Python 3.12+** — use `async def` for routes, `await` for I/O.
- **PaddleOCR:** Use `paddlepaddle` + `paddleocr`. Thread-pool executor for inference (blocking call).

## Engine Abstraction
- **All OCR goes through `OCRProvider` / `OCRRouter`.** Route handlers must NOT call Gemini or PaddleOCR directly.
- `OCRProvider.extract_text(image_bytes) → OCRResult` is the only interface.
- `OCRRouter` decides engine order from `ENGINE_ORDER` env config (comma-separated: `"gemini,paddleocr"`).
- On primary engine failure → fall through to next provider. Both fail → clean 500 error.
- Optional `engine` query param overrides the default (for debug/A-B testing).

## API Contract
- `POST /api/v1/ocr` — multipart form: `image` (file), optional `engine` string
- Response: `{ text: str, confidence: float | null, engine: str, metadata: { filename, content_type, size, processing_time_ms, request_id } }`
- `POST /api/v1/auth/register` — JSON body: `{ email: str, password: str }` → Response: `{ token: str, user: { id, email } }`
- `POST /api/v1/auth/login` — JSON body: `{ email: str, password: str }` → Response: `{ token: str, user: { id, email } }`
- `GET /api/health` — Response: `{ status: str, checks: { database: str, redis: str }, engines: { gemini: str, paddleocr: str } }`

## Rate Limiting + Daily Quota
- **Per-minute:** `slowapi` on `POST /api/v1/ocr` — 10 requests/minute per IP, all tiers.
- **Daily quota (order of checks):**
  1. Extract JWT from `Authorization` header (optional — anonymous requests allowed)
  2. If authenticated → check Redis `ocr_daily:user:{user_id}` < 25
  3. If anonymous → check Redis `ocr_daily:ip:{client_ip}` < 10
  4. If Redis unavailable → fall back to PostgreSQL `daily_usage` table
- **TTL:** Redis counters use TTL = seconds until midnight UTC (set on first increment).
- **Headers:** All OCR responses include `X-RateLimit-Remaining` and `X-RateLimit-Reset`.
- **429 response:** `{ detail: "Daily limit reached. Register for a higher quota.", retry_after: <seconds> }`

## Preprocessing
- `utils/preprocess.py` runs on every image before any engine: grayscale conversion, deskew (if >1°), max-dimension resize (2048px longest edge).
- Called once in the route handler, not duplicated inside providers.

## File Structure
- **Backend:** Follow Section 6.1 layout — `services/ocr/`, `services/auth/`, `models/`, `api/routes/`, `schemas/`.
- **Frontend:** Follow Section 7.3 layout — `features/ocr/`, `features/auth/`, `routes/`, `components/`, `lib/`.
- **Python naming:** `snake_case` for files, functions, variables. API response fields in `snake_case`.
- **TypeScript naming:** `camelCase` for functions/variables, `PascalCase` for components/types.

## Database
- **PostgreSQL** via SQLAlchemy async (`asyncpg` driver).
- **Redis** for ephemeral counters (per-minute rate limits, daily quota). TTL-based expiry.
- **Alembic** for migrations — generate after every model change.
- `User` table: `id` (UUID, PK), `email` (unique, indexed), `password_hash`, `created_at`.
- `DailyUsage` table: `id` (UUID, PK), `user_id` (nullable FK), `ip` (indexed), `date` (date), `count` (int).

## JWT
- **Algorithm:** HS256 (symmetric — single service, no need for RS256).
- **Access token TTL:** 15 minutes.
- **No refresh tokens for v1** — re-login on expiry.
- **Token stored client-side:** `localStorage`. Attached as `Authorization: Bearer <token>`.
- **Auth middleware:** Extracts user from JWT on protected routes. Sets `request.user = None` if no token / invalid — allows anonymous access to OCR (with lower quota).

## Testing
- `pytest` + `pytest-asyncio` + `httpx.AsyncClient` for FastAPI integration tests.
- **OCR tests:** Mock `OCRProvider.extract_text` — never call real Gemini API in tests.
- **Router tests:** Test primary → fallback logic, both-fail case, engine override.
- **Auth tests:** Register duplicate email → 409. Login wrong password → 401. Expired JWT → 401.
- **Quota tests:** Exceed daily limit → 429. Anonymous vs authenticated limits.

## Deployment
- Docker Compose on homelab (`soylab.dpdns.org`): `docker-compose.yml` at repo root.
- Services: `postgres` (16-alpine) + `redis` (7-alpine) + `backend` + `frontend` (nginx).
- Reverse proxy: Traefik (consistent with existing homelab infra).
- `backend/Dockerfile`: multi-stage (build stage → slim runtime, no build tooling in final image).
- `frontend/Dockerfile`: `vite build` → serve static via nginx:alpine.
- GitHub Actions: `ruff` check + `pytest` on PR. Build + push Docker images on merge to `main`.

## Coding Practices
- **Type hints everywhere** — Python: full type annotations. TypeScript: strict mode.
- **Pydantic v2** for all request/response models.
- **Async routes** — use `async def` for all FastAPI endpoints. Blocking operations (PaddleOCR inference, bcrypt) via `run_in_executor` or `fastapi.concurrency.run_in_threadpool`.
- **Structured logging** — use Python `logging` with JSON formatting for production.
- **Error responses** — consistent `{ detail: str }` format for 4xx/5xx. Include `request_id` in all error responses.
- **No dead code** — unused imports, commented-out code, and debug `print()` statements must be removed before commit.