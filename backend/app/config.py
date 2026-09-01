"""Application settings — local office PC and Vercel serverless."""

from __future__ import annotations

import os
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings


def _default_database_url() -> str:
    if os.getenv("VERCEL") or os.getenv("VERCEL_ENV"):
        return "sqlite:////tmp/advanced_damp_prod.db"
    return (
        f"sqlite:///{Path(__file__).resolve().parent.parent / 'data' / 'advanced_damp_local_prod.db'}"
    )


def _default_app_env() -> str:
    if os.getenv("VERCEL") or os.getenv("VERCEL_ENV"):
        return "vercel"
    return "local_production"


class Settings(BaseSettings):
    app_name: str = "Advanced Damp Estimating"
    app_env: str = Field(default_factory=_default_app_env)
    database_url: str = Field(default_factory=_default_database_url)
    company_name: str = "Advanced Damp Ltd"
    company_phone: str = "0300 373 7251"
    company_email: str = "info@advanceddamp.co.uk"
    company_address: str = "45 Fitzroy St, London W1T 6EB"
    default_vat_rate: float = 0.20
    currency: str = "GBP"
    jwt_secret: str = "advanced-damp-local-prod-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 12
    assumed_survey_fee: float = 195.0
    assumed_min_permitted_margin_percent: float = 20.0
    assumed_override_requires_approval_below_target: bool = True
    app_version: str = "1.0.0-local-prod"
    serve_frontend: bool = False
    frontend_dist: str = str(
        Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
    )
    # Comma-separated origins, e.g. https://my-app.vercel.app
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    # When true (default on Vercel), also allow any *.vercel.app preview URL
    cors_allow_vercel_previews: bool = Field(
        default_factory=lambda: bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV"))
    )

    model_config = {"env_file": ".env", "extra": "ignore"}

    @property
    def is_vercel(self) -> bool:
        return self.app_env == "vercel" or bool(os.getenv("VERCEL"))

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()

DEFAULT_JWT_SECRET = "advanced-damp-local-prod-change-me"
