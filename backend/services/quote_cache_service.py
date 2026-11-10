"""Small process-local quote cache with explicit TTL and invalidation."""

from threading import RLock
from time import monotonic
from typing import Any, Callable, Dict, Optional, Tuple


_cache: Dict[str, Tuple[float, Any]] = {}
_lock = RLock()
DEFAULT_TTL_SECONDS = 300


def get_or_set(
    key: str,
    loader: Callable[[], Any],
    ttl_seconds: int = DEFAULT_TTL_SECONDS,
    force_refresh: bool = False,
) -> Any:
    now = monotonic()
    with _lock:
        cached = _cache.get(key)
        if not force_refresh and cached and cached[0] > now:
            return cached[1]

    value = loader()
    if value is None:
        return None

    with _lock:
        _cache[key] = (monotonic() + ttl_seconds, value)
    return value


def clear() -> None:
    with _lock:
        _cache.clear()
