from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.config import settings
from app.core.logging import setup_logging
from app.api.routes import ocr, auth, health
import time

logger = setup_logging()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(f"Path: {request.url.path} - Method: {request.method} - Time: {process_time:.2f}s")
        return response


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
    storage_uri=settings.REDIS_URL,
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
)

app.state.limiter = limiter


async def _rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please slow down."},
    )


app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS", "GET"],
    allow_headers=["*"],
)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SlowAPIMiddleware)

app.include_router(health.router)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(ocr.router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.SERVER_PORT,
        reload=True,
    )