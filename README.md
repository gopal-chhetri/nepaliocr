# NepaliOCR

Web app that extracts text from images of Nepali (Devanagari-script) documents using AI.

## Features

- **OCR via Gemini API** — high-accuracy text extraction using Google's Gemini 2.0 Flash
- **Engine abstraction** — OCRRouter with config-drive engine order; currently Gemini, ready for PaddleOCR
- **Auth tiers** — register (25 OCR requests/day) or anonymous (10 OCR requests/day per IP)
- **Per-minute + daily rate limiting** — double layer to protect Gemini quota
- **Clean UI** — marketing pages (hero, features, about, privacy) + dedicated OCR upload tool

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | FastAPI (Python 3.12, uvicorn) |
| OCR Engine | Gemini 2.0 Flash (google-genai SDK) |
| Database | PostgreSQL 16 (async via SQLAlchemy + asyncpg) |
| Cache | Redis 7 (rate limits, daily quota counters) |
| Auth | JWT (HS256, 15min TTL) + bcrypt passwords |
| Frontend | Vite + React 19 + TanStack Router + TanStack Query |
| Styling | Tailwind CSS + shadcn/ui + framer-motion |
| Deployment | Docker Compose (homelab, soylab.dpdns.org) |

## Quick Start

```bash
# 1. Clone and set up environment
cp backend/.env.sample backend/.env

# 2. Add your Gemini API key(s)
#    Edit backend/.env and set:
#    GEMINI_API_KEYS='["AIzaSyYourKey"]'
#    JWT_SECRET="some-random-secret"

# 3. Full stack with Docker
docker compose up -d

# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Health check: http://localhost:8000/health

# 4. Or run backend only for development
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## API

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Create account (email + password) | None |
| `POST` | `/api/v1/auth/login` | Get JWT token | None |
| `POST` | `/api/v1/ocr` | Extract text from image | Optional (higher quota if authed) |
| `GET` | `/health` | Service health + engine status | None |

### OCR Request

```bash
curl -X POST http://localhost:8000/api/v1/ocr \
  -F "image=@document.jpg"
```

With auth:
```bash
curl -X POST http://localhost:8000/api/v1/ocr \
  -H "Authorization: Bearer <token>" \
  -F "image=@document.jpg"
```

### OCR Response

```json
{
  "text": "नमस्ते, यो एउटा नेपाली पाठ हो।",
  "confidence": null,
  "engine": "gemini",
  "metadata": {
    "filename": "document.jpg",
    "content_type": "image/jpeg",
    "size": 204856,
    "processing_time_ms": 1234,
    "request_id": "1712345678-1",
    "daily_remaining": 9
  }
}
```

## Security

- All secrets loaded from environment — no hardcoded keys
- CORS restricted to explicit allowlist
- Gemini keys never exposed to the frontend
- Passwords hashed with bcrypt
- JWT with short TTL (15 min)
- Rate limiting (10/min/IP) + daily quota per user/IP

## Roadmap

- **Phase 1** (current) — Gemini OCR with auth + quota + clean UI
- **Phase 2** — PaddleOCR baseline (internal, `?engine=paddleocr`)
- **Phase 3** — Fine-tune PaddleOCR on Nepali synthetic + real data
- **Phase 4** — Flip to PaddleOCR as primary engine, Gemini as fallback