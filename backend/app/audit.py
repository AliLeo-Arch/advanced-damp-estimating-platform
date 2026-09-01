"""Audit event helpers."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from app.models import AuditEvent, User


def write_audit(
    db: Session,
    *,
    action: str,
    entity_type: str = "",
    entity_id: str | int = "",
    detail: dict[str, Any] | None = None,
    actor: User | None = None,
) -> None:
    db.add(
        AuditEvent(
            actor_user_id=actor.id if actor else None,
            actor_name=actor.full_name if actor else "system",
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            detail_json=json.dumps(detail or {}),
        )
    )
    db.commit()
