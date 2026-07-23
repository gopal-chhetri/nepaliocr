# Product Requirements Document — Nepali OCR

## Vision
A web app that extracts text from images of Nepali (Devanagari-script) documents. Two OCR paths behind one interface: Gemini API (bootstraps the product now) → self-hosted PaddleOCR (the long-term differentiator, replaces Gemini as primary once accurate enough).

## Domain
`ocr.soylab.dpdns.org`

## Target Users
Anyone needing to digitize Nepali documents: students, researchers, archivists, librarians.

## Quota Tiers
| Tier | Daily Limit | Auth Requirement |
|---|---|---|
| Anonymous | 10 requests/day per IP | None |
| Registered | 25 requests/day per user | Email + password login, JWT |

## Core Features
- Image upload (JPEG/PNG, validated size + type)
- OCR text extraction via Gemini (Phase 1) → PaddleOCR (Phase 4+)
- Result display with copy-to-clipboard
- Engine selection override (`?engine=paddleocr` for debug/A-B comparison)
- User registration + login (email + password, JWT auth)
- Daily usage tracking per user (authenticated) and per IP (anonymous)
- Per-minute rate limiting (10 req/min/IP, all tiers)
- Health endpoint reporting per-engine status

## Non-Goals (v1)
- Handwriting recognition
- Layout / table extraction
- Multi-page PDF batch processing
- User roles / admin panel
- OAuth / social login
- Email verification

## Phased Delivery
- **Phase 1a:** Backend fixes + engine abstraction (Gemini-only)
- **Phase 1b:** Auth + quota system (PostgreSQL, JWT, daily counters)
- **Phase 1c:** Frontend port (Vite + TanStack + marketing pages + auth pages)
- **Phase 1d:** Testing + CI
- **Phase 1e:** Dockerize (backend + frontend + postgres)
- **Phase 2:** PaddleOCR baseline (internal)
- **Phase 3:** Fine-tuning (synthetic data, CER/WER eval)
- **Phase 4:** Flip to PaddleOCR as primary engine