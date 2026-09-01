"""Application logging setup."""

from __future__ import annotations

import logging
import os
from pathlib import Path


def configure_logging() -> None:
    root = logging.getLogger()
    if root.handlers:
        return

    handlers: list[logging.Handler] = [logging.StreamHandler()]

    # File logging only for local / long-running servers (not Vercel serverless)
    if not (os.getenv("VERCEL") or os.getenv("VERCEL_ENV")):
        log_dir = Path(__file__).resolve().parent.parent / "data" / "logs"
        try:
            log_dir.mkdir(parents=True, exist_ok=True)
            handlers.append(logging.FileHandler(log_dir / "app.log", encoding="utf-8"))
        except OSError:
            pass

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        handlers=handlers,
    )
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
