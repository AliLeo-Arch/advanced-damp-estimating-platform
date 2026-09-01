"""SQLite backup and restore helpers."""

from __future__ import annotations

import shutil
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException

from app.config import settings


def db_path() -> Path:
    url = settings.database_url
    if not url.startswith("sqlite:///"):
        raise HTTPException(status_code=400, detail="Backup supported for SQLite only")
    return Path(url.replace("sqlite:///", ""))


def backup_dir() -> Path:
    path = Path(__file__).resolve().parent.parent / "data" / "backups"
    path.mkdir(parents=True, exist_ok=True)
    return path


def create_backup() -> dict:
    source = db_path()
    if not source.exists():
        raise HTTPException(status_code=404, detail="Database file not found")
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    filename = f"advanced_damp-{stamp}.db"
    target = backup_dir() / filename
    shutil.copy2(source, target)
    stat = target.stat()
    return {
        "filename": filename,
        "path": str(target),
        "size_bytes": stat.st_size,
        "created_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
    }


def list_backups() -> list[dict]:
    rows = []
    for file in sorted(backup_dir().glob("advanced_damp-*.db"), reverse=True):
        stat = file.stat()
        rows.append(
            {
                "filename": file.name,
                "size_bytes": stat.st_size,
                "created_at": datetime.fromtimestamp(
                    stat.st_mtime, tz=timezone.utc
                ).isoformat(),
            }
        )
    return rows


def backup_file_path(filename: str) -> Path:
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid backup filename")
    path = backup_dir() / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Backup not found")
    return path


def restore_backup(filename: str) -> dict:
    """Replace live SQLite database with a backup copy."""
    source = backup_file_path(filename)
    target = db_path()
    pre_restore_name = None
    if target.exists():
        pre_restore = backup_dir() / (
            f"pre-restore-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.db"
        )
        shutil.copy2(target, pre_restore)
        pre_restore_name = pre_restore.name
    shutil.copy2(source, target)
    return {
        "restored_from": filename,
        "database": str(target),
        "pre_restore_backup": pre_restore_name,
    }
