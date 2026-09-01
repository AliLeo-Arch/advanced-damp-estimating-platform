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


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    if settings.jwt_secret == DEFAULT_JWT_SECRET:
        logger.warning(
            "JWT secret is still the default — set JWT_SECRET in backend/.env before live use"
        )
    logger.info("Application started (%s %s)", settings.app_name, settings.app_version)
    yield
    logger.info("Application shutdown")


app = FastAPI(
    title="Advanced Damp Estimating API",
    description="Local production estimating platform API for Advanced Damp Ltd.",
    version=settings.app_version,
    lifespan=lifespan,
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s: %s", request.url.path, exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
