"""In-process login attempt throttling (LAN / single-process)."""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException

# Max failed attempts per key within the window before temporary lockout.
MAX_FAILURES = 8
WINDOW_SECONDS = 15 * 60
LOCKOUT_SECONDS = 15 * 60

_lock = threading.Lock()
_failures: dict[str, deque[float]] = defaultdict(deque)
_lockouts: dict[str, float] = {}


def _prune(key: str, now: float) -> None:
    q = _failures[key]
    while q and now - q[0] > WINDOW_SECONDS:
        q.popleft()
    until = _lockouts.get(key)
    if until is not None and until <= now:
        _lockouts.pop(key, None)


def assert_login_allowed(key: str) -> None:
    """Raise 429 if this identity/IP is currently locked out."""
    now = time.monotonic()
    with _lock:
        _prune(key, now)
        until = _lockouts.get(key)
        if until is not None and until > now:
            retry = int(until - now) + 1
            raise HTTPException(
                status_code=429,
                detail=f"Too many failed login attempts. Try again in {retry} seconds.",
                headers={"Retry-After": str(retry)},
            )


def record_login_failure(key: str) -> None:
    now = time.monotonic()
    with _lock:
        _prune(key, now)
        _failures[key].append(now)
        if len(_failures[key]) >= MAX_FAILURES:
            _lockouts[key] = now + LOCKOUT_SECONDS
            _failures[key].clear()


def record_login_success(key: str) -> None:
    with _lock:
        _failures.pop(key, None)
        _lockouts.pop(key, None)


def reset_login_throttle_for_tests() -> None:
    with _lock:
        _failures.clear()
        _lockouts.clear()
