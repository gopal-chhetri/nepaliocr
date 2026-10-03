import io
import os

# Configure before the app is imported: env vars override backend/.env, so
# tests never pick up real API keys or talk to real services.
os.environ["ENVIRONMENT"] = "test"
os.environ["OPENROUTER_API_KEYS"] = "[]"
os.environ["JWT_SECRET"] = "test-secret-key-that-is-long-enough-123"

import pytest  # noqa: E402
from PIL import Image  # noqa: E402

from app.core.rate_limit import limiter  # noqa: E402

limiter.enabled = False


@pytest.fixture
def png_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (40, 20), "white").save(buf, format="PNG")
    return buf.getvalue()


class FakeRedis:
    """Just enough of redis.asyncio for the quota code."""

    def __init__(self):
        self.data: dict[str, int] = {}
        self.fail = False

    def pipeline(self, transaction=True):
        return _FakePipeline(self)

    async def decr(self, key):
        self.data[key] = self.data.get(key, 0) - 1

    async def get(self, key):
        value = self.data.get(key)
        return None if value is None else str(value)


class _FakePipeline:
    def __init__(self, redis: FakeRedis):
        self.redis = redis
        self.ops: list = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    def incr(self, key):
        self.ops.append(("incr", key))

    def expire(self, key, seconds, nx=False):
        self.ops.append(("expire", key))

    async def execute(self):
        if self.redis.fail:
            raise ConnectionError("redis down")
        results = []
        for op, key in self.ops:
            if op == "incr":
                self.redis.data[key] = self.redis.data.get(key, 0) + 1
                results.append(self.redis.data[key])
            else:
                results.append(True)
        return results


@pytest.fixture
def fake_redis(monkeypatch) -> FakeRedis:
    from app.core import security

    redis = FakeRedis()

    async def get_redis():
        return redis

    monkeypatch.setattr(security, "get_redis", get_redis)
    return redis
