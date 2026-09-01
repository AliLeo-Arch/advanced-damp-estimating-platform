from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings


def _ensure_sqlite_parent(url: str) -> None:
    if not url.startswith("sqlite:///"):
        return
    db_path = Path(url.replace("sqlite:///", ""))
    try:
        db_path.parent.mkdir(parents=True, exist_ok=True)
    except OSError:
        # Read-only filesystem (e.g. misconfigured path on serverless)
        pass


_ensure_sqlite_parent(settings.database_url)

connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables and seed rates + default local users."""
    from app import models  # noqa: F401
    from app.seed import seed_rates_if_empty
    from app.seed_estimates import seed_estimates_if_empty
    from app.seed_users import ensure_pricing_settings_defaults, seed_users_if_empty
    from app.schema_migrate import ensure_sqlite_columns

    Base.metadata.create_all(bind=engine)
    ensure_sqlite_columns(engine)
    db = SessionLocal()
    try:
        seed_rates_if_empty(db)
        seed_users_if_empty(db)
        ensure_pricing_settings_defaults(db)
        seed_estimates_if_empty(db)
    finally:
        db.close()
