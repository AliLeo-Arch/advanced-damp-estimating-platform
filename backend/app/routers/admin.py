"""Admin operations: backup and system info."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.audit import write_audit
from app.auth import require_permission
from app.backup import backup_file_path, create_backup, list_backups, restore_backup
from app.config import settings
from app.database import get_db
from app.models import User

router = APIRouter(prefix="/admin", tags=["admin"])


class BackupRestoreRequest(BaseModel):
    filename: str


@router.get("/backups")
def get_backups(
    _: User = Depends(require_permission("backup")),
) -> dict:
    return {"backups": list_backups()}


@router.post("/backups", status_code=201)
def post_backup(
    user: User = Depends(require_permission("backup")),
    db: Session = Depends(get_db),
) -> dict:
    row = create_backup()
    write_audit(
        db,
        action="backup_created",
        entity_type="backup",
        entity_id=row["filename"],
        detail=row,
        actor=user,
    )
    return row


@router.get("/backups/{filename}/download")
def download_backup(
    filename: str,
    _: User = Depends(require_permission("backup")),
):
    path = backup_file_path(filename)
    return FileResponse(
        path,
        media_type="application/octet-stream",
        filename=filename,
    )


@router.post("/backups/restore")
def post_restore_backup(
    payload: BackupRestoreRequest,
    user: User = Depends(require_permission("backup")),
    db: Session = Depends(get_db),
) -> dict:
    result = restore_backup(payload.filename)
    write_audit(
        db,
        action="backup_restored",
        entity_type="backup",
        entity_id=payload.filename,
        detail=result,
        actor=user,
    )
    return result


@router.get("/system")
def system_info(
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("backup")),
) -> dict:
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    return {
        "app": settings.app_name,
        "environment": settings.app_env,
        "version": settings.app_version,
        "database_ok": db_ok,
        "backup_count": len(list_backups()),
    }
