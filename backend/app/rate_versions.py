"""Rate version history helpers."""

from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from app.models import RateItem, RateVersion, User


def record_rate_version(
    db: Session,
    rate: RateItem,
    *,
    previous_cost: float,
    new_cost: float,
    reason: str = "",
    effective_date: str | None = None,
    actor: User | None = None,
) -> RateVersion:
    version = RateVersion(
        rate_item_id=rate.id,
        previous_cost=float(previous_cost),
        new_cost=float(new_cost),
        effective_date=(effective_date or date.today().isoformat()),
        reason=(reason or "").strip(),
        changed_by_user_id=actor.id if actor else None,
        changed_by_name=(actor.full_name if actor else "") or "",
    )
    db.add(version)
    return version
