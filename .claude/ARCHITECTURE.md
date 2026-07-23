# Architecture

## System Layout

```
┌─────────────────────────┐       ┌──────────────────────────────────────────────────────────┐
│   Frontend (SPA)        │       │                   Backend (FastAPI)                        │
│  Vite + React 19        │ HTTP  │                                                           │
│  TanStack Router        │──────▶│  POST /api/v1/auth/register                              │
│  TanStack Query         │       │  POST /api/v1/auth/login                                 │
│  shadcn/ui + Tailwind   │       │  POST /api/v1/ocr  ─── auth middleware ─── quota check    │
└─────────────────────────┘       │       │                                                   │
                                  │       ▼                                                   │
                                  │  validate_image() → preprocess()                          │
                                  │       │                                                   │
                                  │       ▼                                                   │
                                  │  OCRRouter.extract(image, engine?)                        │
                                  │   ┌─────────────┬──────────────────────┐                  │
                                  │   ▼             ▼                      │                  │
                                  │ GeminiProvider  PaddleOCRProvider       │                  │
                                  │ (google-genai,  (PaddleOCR + threadpool)│                  │
                                  │  key rotation)  │                      │                  │
                                  └─────────────────┴──────────────────────┘                  │
                                                                                               │
                                  ┌──────────────────────────────────────────────────────┐    │
                                  │  PostgreSQL (users, daily_usage)                     │    │
                                  │  Redis (rate limit counters, daily quota counters)   │    │
                                  └──────────────────────────────────────────────────────┘    │
```

## Tech Stack
| Layer | Choice | Why |
|---|---|---|
| Backend framework | FastAPI | Already in place, async-native, Pydantic models |
| Backend runtime | Python 3.12 + uvicorn | Already in place |
| Gemini SDK | `google-genai` | Replaces deprecated `google.generativeai` |
| Local OCR | `paddlepaddle` + `paddleocr` | CRNN-based PP-OCRv5/v6 (lighter than PaddleOCR-VL) |
| Database | PostgreSQL + SQLAlchemy (async) | Users + daily usage tracking |
| Cache / counters | Redis | Per-minute rate limits + daily quota (TTL-based reset) |
| Config/secrets | `pydantic-settings` (env-only) | Already wired; `constants.py` bypasses it — will be fixed |
| Auth | JWT (HS256), bcrypt passwords | Simple, no refresh tokens for v1 |
| Testing | `pytest`, `pytest-asyncio`, `httpx.AsyncClient` | Standard FastAPI stack |
| Frontend framework | React 19 + TypeScript + Vite | SPA, no SSR needed (no SEO requirement) |
| Routing | TanStack Router (file-based) | Type-safe, successor to React Router |
| Server state | TanStack Query | `useMutation` for upload, `useQuery` for auth state |
| Styling | Tailwind CSS + shadcn/ui | Already in the repo, ports cleanly to Vite |
| Animation | framer-motion | Already present, keep for polish |

## Request Flow (OCR)

1. Browser → uploads image via multipart form (with JWT in `Authorization` header if logged in)
2. FastAPI route → `auth_middleware` extracts user from JWT (or sets `user=None`)
3. `quota_middleware` checks:
   - Per-minute: `slowapi` (10 req/min/IP, all tiers)
   - Daily: Redis counter → authenticated: `daily_usage:{user_id}` < 25, anonymous: `daily_usage:{ip}` < 10
4. `validate_image()` — checks content type, file size
5. `preprocess()` — grayscale, deskew, max-dimension resize
6. `OCRRouter.extract()` — runs primary engine (configurable via `ENGINE_ORDER` env var)
   - On failure/exception → falls through to next provider in the list
   - Optional `engine` param overrides the default
7. Response → `{ text, confidence, engine, metadata }`

## Auth Flow

1. `POST /api/v1/auth/register` — email + password → bcrypt hash → store in `users` table → return JWT
2. `POST /api/v1/auth/login` — email + password → verify hash → return JWT (TTL: 15 min)
3. All `/api/v1/ocr` requests — JWT extracted from `Authorization: Bearer <token>` (optional — anonymous requests allowed)
4. No refresh tokens for v1 — on expiry, user re-logs in

## Data Stores
| Store | Data | Access |
|---|---|---|
| PostgreSQL | `users` (id, email, password_hash, created_at), `daily_usage` (id, user_id nullable, ip, date, count) | SQLAlchemy async |
| Redis | Per-minute rate limit counters, daily quota counters (TTL to midnight UTC) | `redis-py` |

## Daily Quota Logic
- **Counter key:** `ocr_daily:{identifier}` where identifier = `user:{user_id}` (authenticated) or `ip:{client_ip}` (anonymous)
- **TTL:** set to seconds until midnight UTC on first increment
- **Increment:** atomic `INCR` on each request
- **Check:** if value >= limit (25 or 10), reject with 429 + `X-RateLimit-Remaining: 0`
- **Fallback:** if Redis is unavailable, read/write from PostgreSQL `daily_usage` table

## File Structure

```
nepaliocr/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── logging.py
│   │   │   └── security.py          # rate limiting + daily quota setup
│   │   ├── api/routes/
│   │   │   ├── ocr.py               # POST /api/v1/ocr
│   │   │   ├── auth.py              # POST /api/v1/auth/register, /login
│   │   │   └── health.py            # GET /health
│   │   ├── services/
│   │   │   ├── ocr/
│   │   │   │   ├── base.py          # OCRProvider ABC, OCRResult model
│   │   │   │   ├── gemini_provider.py
│   │   │   │   ├── paddleocr_provider.py
│   │   │   │   └── router.py        # OCRRouter + fallback strategy
│   │   │   └── auth/
│   │   │       ├── auth_service.py  # register, login, verify
│   │   │       ├── jwt_handler.py   # encode, decode, middleware
│   │   │       └── password_handler.py  # bcrypt hash + verify
│   │   ├── models/
│   │   │   ├── user.py              # SQLAlchemy User model
│   │   │   └── daily_usage.py       # SQLAlchemy DailyUsage model
│   │   ├── schemas/
│   │   │   ├── ocr.py               # OCR request/response Pydantic models
│   │   │   └── auth.py              # Register/Login request/response models
│   │   └── utils/
│   │       ├── validate_image.py
│   │       ├── preprocess.py        # grayscale, deskew, resize
│   │       └── api_key_rotator.py
│   ├── tests/
│   │   ├── test_ocr_route.py
│   │   ├── test_auth.py
│   │   └── services/test_router.py
│   ├── alembic/                     # DB migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── __root.tsx
│   │   │   ├── index.tsx            # landing / hero
│   │   │   ├── about.tsx
│   │   │   ├── features.tsx
│   │   │   ├── privacy.tsx
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── upload.tsx           # protected — requires auth
│   │   ├── features/
│   │   │   ├── ocr/
│   │   │   │   ├── ocr-upload.tsx
│   │   │   │   ├── ocr-result.tsx
│   │   │   │   └── use-ocr-mutation.ts
│   │   │   └── auth/
│   │   │       ├── login-form.tsx
│   │   │       ├── register-form.tsx
│   │   │       └── use-auth.ts      # login/register/logout + token storage
│   │   ├── components/              # navbar, hero, about, features, ui/*
│   │   ├── lib/
│   │   │   ├── api-client.ts
│   │   │   └── query-client.ts
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
├── docker-compose.yml
└── .claude/
```

## Deployment
- Docker Compose on homelab (`soylab.dpdns.org`)
- `docker-compose.yml` at repo root: postgres + redis + backend + frontend (nginx)
- Reverse-proxy via Traefik (consistent with existing infra)
- GitHub Actions: lint + test on PR, build+push images on merge to main