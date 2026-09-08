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
    "quotation_snapshot_json": "TEXT DEFAULT '{}'",
    "accepted_at": "DATETIME",
    "accepted_by_name": "TEXT DEFAULT ''",
    "acceptance_method": "TEXT DEFAULT ''",
    "acceptance_po_reference": "TEXT DEFAULT ''",
    "acceptance_notes": "TEXT DEFAULT ''",
}

RATE_ITEM_COLUMNS = {
    "effective_date": "TEXT DEFAULT ''",
}

PRICING_SETTINGS_COLUMNS = {
    "assumptions_json": "TEXT DEFAULT '[]'",
    "exclusions_json": "TEXT DEFAULT '[]'",
    "guarantee_wording": "TEXT DEFAULT ''",
    "survey_fee_credit_wording": "TEXT DEFAULT ''",
    "acceptance_instructions": "TEXT DEFAULT ''",
    "company_display_name": "TEXT DEFAULT ''",
    "company_phone": "TEXT DEFAULT ''",
    "company_email": "TEXT DEFAULT ''",
    "company_address": "TEXT DEFAULT ''",
    "company_website": "TEXT DEFAULT ''",
    "company_tagline": "TEXT DEFAULT ''",
    "quote_prefix": "TEXT DEFAULT 'EST'",
}

ACTUALS_COLUMNS = {
    "marked_complete": "INTEGER DEFAULT 0",
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
        _add_missing(conn, "rate_items", RATE_ITEM_COLUMNS)
        _add_missing(conn, "pricing_settings", PRICING_SETTINGS_COLUMNS)
        _add_missing(conn, "estimate_actuals", ACTUALS_COLUMNS)
        # Backfill: rows that already have every cost category filled are treated
        # as historically complete so reporting does not regress.
        conn.execute(
            text(
                """
                UPDATE estimate_actuals
                SET marked_complete = 1
                WHERE COALESCE(marked_complete, 0) = 0
                  AND materials_actual IS NOT NULL
                  AND labour_actual IS NOT NULL
                  AND waste_actual IS NOT NULL
                  AND travel_actual IS NOT NULL
                  AND prelims_actual IS NOT NULL
                  AND other_actual IS NOT NULL
                """
            )
        )
