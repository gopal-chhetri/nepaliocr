# Build Phases

Each phase is independently demoable. Mark completed with `[x]`.

## Phase Checklist

### Phase 1a — Backend fixes + engine abstraction (Gemini-only)
- [x] Remove hardcoded keys from `constants.py`; purge from git history via `git filter-repo`
- [x] Migrate `google.generativeai` → `google-genai` SDK; update model designation
- [x] Fix `APIKeyRotator`: load-based rotation (not fixed 60s timer), distinguish invalid key vs rate-limited
- [x] Add `utils/preprocess.py` — grayscale, autocontrast, max-dimension resize
- [x] Create `services/ocr/base.py` — `OCRProvider` ABC, `OCRResult` model
- [x] Create `services/ocr/gemini_provider.py` — wraps google-genai, implements `OCRProvider`
- [x] Create `services/ocr/router.py` — `OCRRouter` with config-driven `ENGINE_ORDER` + fallback
- [x] Slim down `api/routes/ocr.py` to delegate to `OCRRouter`
- [x] Fix health check typo in `main.py`
- [x] Add `slowapi` per-minute rate limiting on `POST /api/v1/ocr` (10/min/IP)

### Phase 1b — Auth + quota system
- [x] Add PostgreSQL + Redis to Docker Compose (dev)
- [x] Set up SQLAlchemy async engine + auto table creation
- [x] Create `models/user.py` (User table) + `models/daily_usage.py` (DailyUsage table)
- [x] Create `services/auth/password_handler.py` — bcrypt hash/verify via `passlib`
- [x] Create `services/auth/jwt_handler.py` — HS256 encode/decode, middleware to extract user
- [x] Create `services/auth/auth_service.py` — register (check duplicate email, hash, store), login (fetch, verify, return JWT)
- [x] Create `api/routes/auth.py` — `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- [x] Add daily quota middleware: authenticated 25/day/user, anonymous 10/day/IP (Redis counters with TTL to midnight UTC)
- [x] Wire auth middleware + quota check into `POST /api/v1/ocr` route

### Phase 1c — Frontend port
- [x] Create Vite + React 19 project with TanStack Router
- [x] Add TanStack Query, Tailwind, shadcn/ui components
- [x] Port existing components: navbar, hero, features, about, privacy
- [x] Create `lib/auth-context.tsx` — login, register, logout, token storage (localStorage), auth state
- [x] Create `features/auth/login-form.tsx`, `register-form.tsx`
- [x] Create routes: login, register, upload (protected with anonymous banner)
- [x] Port `ocr-upload.tsx` to use `useMutation`; create `use-ocr-mutation.ts`
- [x] Create `lib/api-client.ts` — typed fetch wrapper, VITE_ env var, auto-attaches JWT

### Phase 1d — Testing + CI
- [ ] `pytest` + `pytest-asyncio` + `httpx.AsyncClient` setup
- [ ] Unit tests for `OCRRouter` fallback logic (mock providers)
- [ ] Unit tests for auth (register duplicate, login wrong password, JWT expiry)
- [ ] Integration test for OCR route validation (bad file type, too large, missing file)
- [ ] Integration test for quota enforcement (exceed daily limit → 429)
- [ ] `ruff` lint config + GitHub Actions lint step
- [ ] GitHub Actions: test on PR

### Phase 1e — Dockerize
- [x] `backend/Dockerfile` — multi-stage build
- [x] `frontend/Dockerfile` — build static output → nginx serve
- [x] `docker-compose.yml` — postgres + redis + backend + frontend
- [ ] GitHub Actions: build + push images to GHCR on merge to main

**Phase 1 complete — Gemini OCR on Docker Compose with auth + quota**

- [ ] **Phase 2 — PaddleOCR baseline** (internal only, `?engine=paddleocr`)
- [ ] **Phase 3 — Fine-tuning** (synthetic data generation, CER/WER eval vs Gemini)
- [ ] **Phase 4 — Flip** (`ENGINE_ORDER = ["paddleocr", "gemini"]`)

## Skills & Tools
- `claude-mem` — session memory across conversations
- `vibesec-skill` — security best practices