"""SQLite backup and restore helpers."""

from __future__ import annotations

import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException

from app.config import settings

DEFAULT_KEEP_BACKUPS = 30


def db_path() -> Path:
    url = settings.database_url
    if not url.startswith("sqlite:///"):
        raise HTTPException(status_code=400, detail="Backup supported for SQLite only")
    return Path(url.replace("sqlite:///", ""))


def backup_dir() -> Path:
    path = Path(__file__).resolve().parent.parent / "data" / "backups"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _copy_sqlite(source: Path, target: Path) -> None:
    """Prefer online SQLite backup API; fall back to file copy if needed."""
    try:
        src = sqlite3.connect(f"file:{source.as_posix()}?mode=ro", uri=True)
        try:
            dst = sqlite3.connect(str(target))
            try:
                with dst:
                    src.backup(dst)
            finally:
                dst.close()
        finally:
            src.close()
    except sqlite3.Error:
        shutil.copy2(source, target)


def create_backup(*, keep: int | None = DEFAULT_KEEP_BACKUPS) -> dict:
    source = db_path()
    if not source.exists():
        raise HTTPException(status_code=404, detail="Database file not found")
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S-%f")
    filename = f"trade_estimating-{stamp}.db"
    target = backup_dir() / filename
    _copy_sqlite(source, target)
    if keep is not None:
        prune_backups(keep=keep)
    stat = target.stat()
    return {
        "filename": filename,
        "path": str(target),
        "size_bytes": stat.st_size,
        "created_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
    }


def prune_backups(*, keep: int = DEFAULT_KEEP_BACKUPS) -> int:
    """Delete oldest trade_estimating-*.db files beyond keep count. Returns deleted count."""
    if keep < 1:
        return 0
    files = sorted(
        backup_dir().glob("trade_estimating-*.db"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    deleted = 0
    for file in files[keep:]:
        file.unlink(missing_ok=True)
        deleted += 1
    return deleted


def list_backups() -> list[dict]:
    rows = []
    for file in sorted(backup_dir().glob("trade_estimating-*.db"), reverse=True):
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
        _copy_sqlite(target, pre_restore)
        pre_restore_name = pre_restore.name
    _copy_sqlite(source, target)
    return {
        "restored_from": filename,
        "database": str(target),
        "pre_restore_backup": pre_restore_name,
    }
