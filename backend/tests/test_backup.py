"""SQLite backup and restore helpers."""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi import HTTPException

from app import backup


@pytest.fixture
def backup_env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_file = tmp_path / "live.db"
    db_file.write_bytes(b"live-database-content")
    backup_root = tmp_path / "backups"
    backup_root.mkdir()

    monkeypatch.setattr(
        backup,
        "db_path",
        lambda: db_file,
    )
    monkeypatch.setattr(
        backup,
        "backup_dir",
        lambda: backup_root,
    )
    return {"db": db_file, "backup_dir": backup_root}


def test_create_backup(backup_env):
    row = backup.create_backup()
    assert row["filename"].startswith("advanced_damp-")
    assert Path(row["path"]).exists()
    assert row["size_bytes"] > 0


def test_list_backups(backup_env):
    backup.create_backup()
    rows = backup.list_backups()
    assert len(rows) == 1
    assert rows[0]["filename"].startswith("advanced_damp-")


def test_restore_backup_creates_pre_restore_copy(backup_env):
    created = backup.create_backup()
    backup_env["db"].write_bytes(b"changed-live-data")

    result = backup.restore_backup(created["filename"])

    assert backup_env["db"].read_bytes() == b"live-database-content"
    assert result["restored_from"] == created["filename"]
    assert result["pre_restore_backup"] is not None
    pre_restore = backup_env["backup_dir"] / result["pre_restore_backup"]
    assert pre_restore.read_bytes() == b"changed-live-data"


def test_restore_backup_without_existing_db(backup_env):
    created = backup.create_backup()
    backup_env["db"].unlink()

    result = backup.restore_backup(created["filename"])

    assert backup_env["db"].exists()
    assert result["pre_restore_backup"] is None


def test_backup_file_path_rejects_traversal():
    with pytest.raises(HTTPException) as exc:
        backup.backup_file_path("../secret.db")
    assert exc.value.status_code == 400
