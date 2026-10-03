from fastapi import Request
from slowapi import Limiter

from app.core.config import settings


def client_ip(request: Request) -> str:
    """The real client IP.

    Behind Cloudflare the TCP peer is a Cloudflare edge, so prefer its
    CF-Connecting-IP header. Otherwise use the peer address, which uvicorn
    resolves from Traefik's X-Forwarded-For (run with --proxy-headers).
    """
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()
    return request.client.host if request.client else "unknown"


# One limiter for the whole app, backed by Redis so counts are shared across
# workers and restarts. Falls back to in-memory counting if Redis is down.
limiter = Limiter(
    key_func=client_ip,
    default_limits=[],
    storage_uri=settings.REDIS_URL,
    in_memory_fallback_enabled=True,
)
