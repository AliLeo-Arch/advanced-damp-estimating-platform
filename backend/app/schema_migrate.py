"""Lightweight SQLite column adds for local production without Alembic."""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.engine import Engine


ESTIMATE_COLUMNS = {
    "parent_estimate_id": "INTEGER",
    "approved_by_user_id": "INTEGER",
    "approved_at": "DATETIME",
    "approval_notes": "TEXT DEFAULT ''",
    "quote_issued_at": "DATETIME",
    "quote_valid_until": "DATETIME",
    "quote_vat_rate": "FLOAT",
}

PRICING_SETTINGS_COLUMNS = {
    "assumptions_json": "TEXT DEFAULT '[]'",
    "exclusions_json": "TEXT DEFAULT '[]'",
    "guarantee_wording": "TEXT DEFAULT ''",
    "survey_fee_credit_wording": "TEXT DEFAULT ''",
    "acceptance_instructions": "TEXT DEFAULT ''",
}


def _add_missing(conn, table: str, columns: dict[str, str]) -> None:
    rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    existing = {row[1] for row in rows}
    for name, ddl in columns.items():
        if name not in existing:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))


def ensure_sqlite_columns(engine: Engine) -> None:
    if not str(engine.url).startswith("sqlite"):
        return
    with engine.begin() as conn:
        _add_missing(conn, "estimates", ESTIMATE_COLUMNS)
        _add_missing(conn, "pricing_settings", PRICING_SETTINGS_COLUMNS)
