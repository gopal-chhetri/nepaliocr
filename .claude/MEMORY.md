# Session Memory

## Current Phase
Phase 1a-1c — Backend + Frontend implementation complete

## Recently Completed
- Phase 1a: Engine abstraction (OCRProvider, GeminiProvider, OCRRouter), fixed key rotator, preprocess pipeline, rate limiting with slowapi
- Phase 1b: Auth system (PostgreSQL User model, bcrypt passwords, JWT auth, register/login endpoints, daily quota middleware with Redis)
- Phase 1c: Frontend port to Vite + React 19 + TanStack Router + TanStack Query, ported all marketing components (navbar, hero, features, about, privacy), added auth pages (login, register), protected OCR route with anonymous banner, wired useMutation for OCR upload
- Phase 1e: Dockerfiles for backend + frontend, docker-compose.yml with postgres + redis + backend + frontend

## Current File Being Worked On
(None — implementation complete, verifying)

## Next
Phase 1d: Write tests (pytest for OCR route validation, auth, quota, router fallback), set up GitHub Actions CI with ruff + pytest