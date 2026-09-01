"""Vercel serverless entrypoint for the FastAPI application."""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure backend package root is importable on Vercel
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from app.main import app  # noqa: E402

__all__ = ["app"]
