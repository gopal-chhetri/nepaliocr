import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.core.config import settings
from app.core.security import reserve_daily_quota


def _request(user=None) -> Request:
    req = Request({"type": "http", "headers": [], "client": ("198.51.100.7", 1)})
    req.state.user = user
    return req


async def test_reserves_until_limit_then_429(fake_redis):
    limit = settings.DAILY_LIMIT_ANONYMOUS
    for i in range(limit):
        remaining, _ = await reserve_daily_quota(_request())
        assert remaining == limit - i - 1

    with pytest.raises(HTTPException) as exc:
        await reserve_daily_quota(_request())
    assert exc.value.status_code == 429
    # The rejected attempt is not counted.
    assert fake_redis.data["ocr_daily:ip:198.51.100.7"] == limit


async def test_release_gives_the_attempt_back(fake_redis):
    _, release = await reserve_daily_quota(_request())
    await release()
    assert fake_redis.data["ocr_daily:ip:198.51.100.7"] == 0


async def test_users_are_counted_separately_from_ips(fake_redis):
    await reserve_daily_quota(_request(user={"id": "u1", "email": "a@b.c"}))
    assert fake_redis.data == {"ocr_daily:user:u1": 1}


async def test_redis_down_refuses_anonymous_and_allows_users(fake_redis):
    fake_redis.fail = True
    with pytest.raises(HTTPException) as exc:
        await reserve_daily_quota(_request())
    assert exc.value.status_code == 503

    remaining, _ = await reserve_daily_quota(_request(user={"id": "u1", "email": "a@b.c"}))
    assert remaining == settings.DAILY_LIMIT_AUTHENTICATED
