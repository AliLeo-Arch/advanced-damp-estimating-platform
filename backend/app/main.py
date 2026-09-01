"""Advanced Damp Estimating API — local production foundation."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import DEFAULT_JWT_SECRET, settings
from app.database import init_db
from app.logging_config import configure_logging
from app.routers import actuals, admin, auth, crm, estimates, health, rates

configure_logging()
logger = logging.getLogger(__name__)

_db_ready = False


def _ensure_db() -> None:
    global _db_ready
    if _db_ready:
        return
    init_db()
    _db_ready = True


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _ensure_db()
    if settings.jwt_secret == DEFAULT_JWT_SECRET:
        logger.warning(
            "JWT secret is still the default — set JWT_SECRET before live use"
        )
    logger.info(
        "Application started (%s %s, env=%s)",
        settings.app_name,
        settings.app_version,
        settings.app_env,
    )
    yield
    logger.info("Application shutdown")


app = FastAPI(
    title="Advanced Damp Estimating API",
    description="Estimating platform API for Advanced Damp Ltd.",
    version=settings.app_version,
    lifespan=lifespan,
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s: %s", request.url.path, exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


cors_kwargs: dict = {
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
if settings.cors_allow_vercel_previews:
    cors_kwargs["allow_origins"] = settings.cors_origin_list
    cors_kwargs["allow_origin_regex"] = r"https://.*\.vercel\.app"
else:
    cors_kwargs["allow_origins"] = settings.cors_origin_list

app.add_middleware(CORSMiddleware, **cors_kwargs)


@app.middleware("http")
async def ensure_database(request: Request, call_next):
    """Guarantees DB init on Vercel cold starts where lifespan may not run."""
    try:
        _ensure_db()
    except Exception:
        logger.exception("Database init failed for %s", request.url.path)
        return JSONResponse(
            status_code=503,
            content={"detail": "Database unavailable — check serverless storage / DATABASE_URL"},
        )
    return await call_next(request)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


app.include_router(health.router)
app.include_router(auth.router, prefix="/api")
app.include_router(crm.router, prefix="/api")
app.include_router(rates.router, prefix="/api")
app.include_router(estimates.router, prefix="/api")
app.include_router(actuals.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


def _mount_frontend() -> None:
    if not settings.serve_frontend:
        return
    dist = Path(settings.frontend_dist)
    index = dist / "index.html"
    if not index.exists():
        logger.warning(
            "SERVE_FRONTEND enabled but %s not found — run `npm run build` in frontend/",
            index,
        )
        return
    app.mount("/", StaticFiles(directory=str(dist), html=True), name="frontend")
    logger.info("Serving frontend from %s", dist)


_mount_frontend()

# Vercel serverless may not always run lifespan before the first request
if settings.is_vercel:
    try:
        _ensure_db()
    except Exception:
        logger.exception("Database init during import failed — will retry on first request")
