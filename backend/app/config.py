from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Advanced Damp Estimating"
    app_env: str = "local_production"
    database_url: str = (
        f"sqlite:///{Path(__file__).resolve().parent.parent / 'data' / 'advanced_damp_local_prod.db'}"
    )
    company_name: str = "Advanced Damp Ltd"
    company_phone: str = "0300 373 7251"
    company_email: str = "info@advanceddamp.co.uk"
    company_address: str = "45 Fitzroy St, London W1T 6EB"
    default_vat_rate: float = 0.20
    currency: str = "GBP"
    jwt_secret: str = "advanced-damp-local-prod-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 12
    # Assumed commercial defaults (replace with live Advanced Damp policy later)
    assumed_survey_fee: float = 195.0
    assumed_min_permitted_margin_percent: float = 20.0
    assumed_override_requires_approval_below_target: bool = True
    app_version: str = "1.0.0-local-prod"
    serve_frontend: bool = False
    frontend_dist: str = str(
        Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
    )

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

DEFAULT_JWT_SECRET = "advanced-damp-local-prod-change-me"
