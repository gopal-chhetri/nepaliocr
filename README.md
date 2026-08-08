# NepaliOCR

Web app that extracts text from images of Nepali (Devanagari-script) documents using AI.

## Features

- **OCR via OpenRouter (Gemini)**: high-accuracy Devanagari text extraction, engine abstraction (`OCRRouter`)
- **Auth tiers**: register (25 OCR requests/day) or anonymous (10 OCR requests/day per IP)
- **Per-minute + daily rate limiting**: double layer to protect engine quota
- **Object storage**: every OCR'd image is persisted to self-hosted MinIO (bucket `nepali-ocr`, keys `ocr/<uuid>.png` / `samples/<uuid>.png`)
- **Contribute page** (`/contribute`), two tools:
  - **Data Collection**: generate random Nepali sentences (selectable 1–20 lines, default 1) from the poem dictionary, render + OCR-test them, then save as a server-side sample
  - **Annotation**: server serves the next un-annotated sample image; users transcribe it with the built-in Devanagari typing editor (romanized/traditional) and submit — building ground-truth data
- **Local OCR history**: last 20 runs stored in the browser (thumbnail + text), with re-run/download/delete
- **Result polish**: usage badge, char/word/line/byte counts, engine badge, `.txt` download
- **Clean UI**: marketing pages (hero, features, about, privacy) + dedicated OCR converter tool

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | FastAPI (Python 3.12, uvicorn) |
| OCR Engine | OpenRouter (Gemini 2.0 Flash) |
| Database | PostgreSQL 16 (async via SQLAlchemy + asyncpg) |
| Cache | Redis 7 (rate limits, daily quota counters) |
| Object Storage | MinIO (self-hosted, presigned URLs) |
| Auth | JWT (HS256, 15min TTL) + bcrypt passwords |
| Frontend | Vite + React 19 + TanStack Router + TanStack Query |
| Styling | Tailwind CSS + shadcn/ui + framer-motion |
| Deployment | Docker Compose (homelab, soylab.dpdns.org) |

## Quick Start

```bash
# 1. Set up backend env
cp deployments/local-dev/.env.example deployments/local-dev/.env
#    Add OpenRouter key(s):
#    OPENROUTER_API_KEYS='["sk-or-v1-..."]'
#    JWT_SECRET="some-random-secret"

# 2. Full stack with Docker (postgres + redis + minio + backend + frontend)
cd deployments/local-dev
docker compose up -d --build

# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Health check: http://localhost:8000/api/health
# MinIO console: http://localhost:9001 (minioadmin / minioadmin)
```

Local MinIO overrides (in `deployments/local-dev/.env`):
- `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` — root credentials (default `minioadmin`)
- `MINIO_PUBLIC_ENDPOINT=localhost:9000` — browser-reachable host used for presigned URLs (the container-internal `minio:9000` is never reachable from the browser)

## API

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Create account (email + password) | None |
| `POST` | `/api/v1/auth/login` | Get JWT token | None |
| `POST` | `/api/v1/ocr` | Extract text from image (`image` file **or** `image_key`) | Optional (higher quota if authed) |
| `GET` | `/api/v1/usage` | Current daily quota usage (`limit`, `used`, `remaining`) | Optional |
| `POST` | `/api/v1/annotate` | Register a sample (`image_key`, `expected_text?`, `ocr_text?`, `lines?`) | Optional |
| `GET` | `/api/v1/annotate/next` | Next un-annotated sample (`sample_id`, `image_url`, counts); 404 when exhausted | Optional |
| `POST` | `/api/v1/annotate/{sample_id}` | Submit annotation text for a sample | Optional |
| `POST` | `/api/v1/storage/presign-upload` | Get presigned PUT URL to upload an image to MinIO | Optional |
| `POST` | `/api/v1/storage/presign-get` | Get presigned GET URL for an object key | Optional |
| `GET` | `/api/health` | Service health + dependency + engine status | None |
| `GET` | `/api/healthz` | Liveness (always 200) | None |

### OCR Request

```bash
# Direct file upload (the backend persists the image to MinIO automatically)
curl -X POST http://localhost:8000/api/v1/ocr \
  -F "image=@document.jpg"

# Or via an already-stored object key
curl -X POST http://localhost:8000/api/v1/ocr \
  -F "image_key=ocr/<uuid>.png"

# Optional: purpose=sample marks objects under samples/ (sentence-generator loop)
curl -X POST http://localhost:8000/api/v1/ocr \
  -F "image=@test.png" -F "purpose=sample"
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
    "daily_remaining": 9,
    "image_key": "ocr/6cfe7278924a4a209a1fdec7fab50439.png"
  }
}
```

### MinIO object flow

1. `POST /api/v1/storage/presign-upload` with `{filename, content_type, size, purpose}` → `{key, url}` (5-min presigned PUT)
2. Client `PUT`s the bytes directly to the returned URL (browser-reachable endpoint)
3. `POST /api/v1/ocr` with `image_key` (+ `purpose=sample` to relocate under `samples/`)
4. `POST /api/v1/storage/presign-get` returns a short-lived GET URL for display

## Production

New compose secrets (Infisical) used by `deployments/production/compose.yml`:
- `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`
There is no need for bucket CORS config because uploads flow through the backend and image display uses plain `<img>` tags.

Public MinIO hosts (Traefik):
- `minio.<DOMAIN>` → S3 API (presigned URLs)
- `minio-console.<DOMAIN>` → console UI (port 9001, sign in with `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`)

## Security

- All secrets loaded from environment: no hardcoded keys
- CORS restricted to explicit allowlist
- Gemini keys never exposed to the frontend
- Passwords hashed with bcrypt
- JWT with short TTL (15 min)
- Rate limiting (10/min/IP) + daily quota per user/IP

## Roadmap

- **Phase 1** (current): Gemini OCR with auth + quota + clean UI
- **Phase 2**: PaddleOCR baseline (internal, `?engine=paddleocr`)
- **Phase 3**: Fine-tune PaddleOCR on Nepali synthetic + real data
- **Phase 4**: Flip to PaddleOCR as primary engine, Gemini as fallback