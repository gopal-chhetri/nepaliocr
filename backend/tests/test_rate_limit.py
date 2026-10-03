from starlette.requests import Request

from app.core.rate_limit import client_ip


def _request(headers: dict[str, str], peer: str = "10.0.0.5") -> Request:
    return Request(
        {
            "type": "http",
            "headers": [(k.lower().encode(), v.encode()) for k, v in headers.items()],
            "client": (peer, 1234),
        }
    )


def test_prefers_cloudflare_header():
    assert client_ip(_request({"CF-Connecting-IP": "203.0.113.9"})) == "203.0.113.9"


def test_falls_back_to_peer_address():
    assert client_ip(_request({})) == "10.0.0.5"
