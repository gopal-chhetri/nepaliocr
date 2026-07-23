import time
import re
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class APIKeyRotator:
    def __init__(self, api_keys: List[str]):
        self.api_keys = api_keys
        self._usage_counts: Dict[str, int] = {k: 0 for k in api_keys}
        self._failed_keys: Dict[str, float] = {}
        self._invalid_keys: set[str] = set()

    def _get_available_keys(self) -> List[str]:
        now = time.time()
        available = []
        for key in self.api_keys:
            if key in self._invalid_keys:
                continue
            if key in self._failed_keys:
                if now < self._failed_keys[key]:
                    continue
                del self._failed_keys[key]
            available.append(key)
        return available

    def get_next_key(self) -> str:
        available = self._get_available_keys()
        if not available:
            raise RuntimeError("No API keys available. Please try again later.")

        min_usage_key = min(available, key=lambda k: self._usage_counts[k])
        self._usage_counts[min_usage_key] += 1
        return min_usage_key

    def _parse_retry_delay(self, error_message: str) -> Optional[int]:
        match = re.search(r'retryDelay["\']:\s*["\'](\d+)s', error_message)
        if match:
            return int(match.group(1)) + 5
        return None

    def mark_key_as_failed(self, key: str, error_message: str = ""):
        error_lower = error_message.lower()
        if any(m in error_lower for m in ["invalid key", "permission denied", "not found", "api key not valid"]):
            self._invalid_keys.add(key)
            logger.error(f"API key permanently invalid: {key[:15]}...")
            return

        retry_delay = self._parse_retry_delay(error_message)
        if retry_delay:
            self._failed_keys[key] = time.time() + retry_delay
            logger.warning(f"API key rate-limited, retry in {retry_delay}s: {key[:15]}...")
        else:
            self._failed_keys[key] = time.time() + 60
            logger.warning(f"API key temporarily failed (rate-limited/quota): {key[:15]}...")

    def retry_after_seconds(self) -> Optional[int]:
        now = time.time()
        if not self._failed_keys:
            return None
        earliest = min(retry_at for retry_at in self._failed_keys.values())
        wait = int(earliest - now)
        return max(wait, 0) if wait > 0 else None