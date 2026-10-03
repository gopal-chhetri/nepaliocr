# NepaliOCR

## System Architecture

```mermaid
graph TD
    User[User / Client Frontend] -->|1. Request Upload| FastAPI[FastAPI Backend]
    FastAPI -->|2. Generate Presigned URL| MinIO[MinIO Object Storage]
    User -->|3. Direct PUT Image| MinIO
    User -->|4. Request OCR (image_key)| FastAPI
    FastAPI -->|5. Forward Image URL| OpenRouter[OpenRouter / Gemini API]
    OpenRouter -->|6. Return Extracted Text| FastAPI
    FastAPI -->|7. Save Result / Quota| PostgreSQL[(PostgreSQL DB)]
    FastAPI -->|8. Increment Quota / Rate Limits| Redis[(Redis Cache)]
    
    subgraph Background Workers
        FastAPI -->|Enqueue Line Segmentation| ARQ[arq Queue]
        ARQ --> OpenCV[OpenCV Worker]
        OpenCV -->|Read Raw Image| MinIO
        OpenCV -->|Segment into lines| OpenCV
        OpenCV -->|Upload segments| MinIO
    end
```

## Features

- **OCR via OpenRouter (Gemini)**: high-accuracy Devanagari text extraction, engine abstraction (`OCRRouter`)
- **Auth tiers**: register (25 OCR requests/day) or anonymous (10 OCR requests/day per IP)
- **Per-minute + daily rate limiting**: double layer to protect engine quota
- **Object storage**: every OCR'd image is persisted to self-hosted MinIO (bucket `nepali-ocr`, keys `ocr/<uuid>.png` / `samples/<uuid>.png`)
- **Contribute page** (`/contribute`) with two tabs:
  - **Data Collection**: generate random Nepali sentences (1–20 lines, default 1) from the poem dictionary, render + OCR-test them, then save as a server-side sample. Submit is pinned to the **top** of the "Image source" card — no scroll-to-submit needed.
    - Source modes: hand-written (camera/capture upload to `uploads/`) or AI-rendered (canvas render → OCR test → `rendered/`).
    - Extracted line images are segmented in the background by the OpenCV `arq` worker into `lines/` and feed the Annotation tab.
  - **Annotation**: server serves the next un-annotated line image (`GET /api/v1/annotate/next` with an `exclude` set so skipped/missing images advance); transcribe with the built-in Devanagari editor and submit. The editor keyboard is a **full-width `4×1` grid** of groups (Consonants · Vowels · Vowel signs · Numbers · Extra) with `ग्`, `क्ष`, `त्र`, `ज्ञ`, `श्र`, `ऋ`, `। ॥ ॐ` keys. The keyboard groups occupy the entire content width, and a Submit button is also pinned at the **top** of the Annotation card (keyboard sits below a full-width layout). On auth pages (sign in/up) the form is moved up (`pt-12`) and the page sets `overflow-y-hidden` so no unnecessary vertical scrollbar appears.
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
| Worker | `arq` (asyncio) + `opencv-python-headless`: background line segmentation → `lines/<doc>/<i>.jpg` |
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

## Routing & Layout

The app shell mounts the `Navbar` once at the **root layout** (`<Navbar />` + `<Outlet />`); route pages only render their `<Outlet />` content. This means tab-to-tab navigation never unmounts/remounts the Navbar (no animation flicker / perceived reload), and the router handles transitions client-side via **pushState** — so switching between `/`, `/ocr`, `/about`, `/privacy`, `/contribute`, `/upload` never triggers a full page reload.

## API

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Create account (email + password) | None |
| `POST` | `/api/v1/auth/login` | Get JWT token | None |
| `POST` | `/api/v1/ocr` | Extract text from image (`image` file **or** `image_key`) | Optional (higher quota if authed) |
| `GET` | `/api/v1/usage` | Current daily quota usage (`limit`, `used`, `remaining`) | Optional |
| `POST` | `/api/v1/annotate` | Register a sample (`image_key`, `expected_text?`, `ocr_text?`, `lines?`) | **Required** |
| `GET` | `/api/v1/annotate/next` | Next un-annotated sample (`sample_id`, `image_url`, counts); 404 when exhausted | Optional |
| `POST` | `/api/v1/annotate/{segment_id}` | Submit annotation text for a line (409 if already annotated) | **Required** |
| `POST` | `/api/v1/storage/presign-upload` | Get a presigned POST policy (`url` + `fields`) to upload a contribution image to MinIO; size and type are enforced by MinIO | Optional |
| `POST` | `/api/v1/storage/presign-get` | Get presigned GET URL for an object key (not available for `ocr/` images) | Optional |
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

1. `POST /api/v1/storage/presign-upload` with `{filename, content_type, size, section}` → `{key, url, fields}` (5-min presigned POST policy; `section` is `uploads` or `rendered`)
2. Client `POST`s multipart form data to `url`: every entry of `fields`, then the file as `file`
3. `POST /api/v1/contributions` with the `image_key` to queue line segmentation for annotation

Images sent to the OCR tool are stored under `ocr/`, never added to the annotation dataset, and deleted after 1 day by a MinIO lifecycle rule (see the privacy page).

## Database migrations

The schema is managed with Alembic (`backend/alembic/`). Both backend Dockerfiles run `alembic upgrade head` before starting the API. To add a migration: `cd backend && alembic revision -m "describe change"`.

## Production

New compose secrets (Infisical) used by `deployments/production/compose.yml`:
- `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`
There is no need for bucket CORS config because uploads flow through the backend and image display uses plain `<img>` tags.

Public MinIO hosts (Traefik `Host(...)` rules, set via env):
- `MINIO_DOMAIN` → S3 API (presigned URLs). The backend/worker advertise this as `MINIO_PUBLIC_ENDPOINT`.
- `MINIO_CONSOLE_DOMAIN` → console UI (port 9001, sign in with `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`)

The hosts are defined by the `MINIO_DOMAIN` / `MINIO_CONSOLE_DOMAIN` environment variables (see `deployments/production/.env.example`) and must match between Traefik routing rules and `MINIO_PUBLIC_ENDPOINT`.

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