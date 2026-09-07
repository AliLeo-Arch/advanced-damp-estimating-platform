"""SQLite backup and restore helpers."""

from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest
from fastapi import HTTPException

from app import backup


@pytest.fixture
def backup_env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_file = tmp_path / "live.db"
    conn = sqlite3.connect(str(db_file))
    conn.execute("CREATE TABLE demo (id INTEGER PRIMARY KEY, note TEXT)")
    conn.execute("INSERT INTO demo (note) VALUES ('live-database-content')")
    conn.commit()
    conn.close()

    backup_root = tmp_path / "backups"
    backup_root.mkdir()

    monkeypatch.setattr(backup, "db_path", lambda: db_file)
    monkeypatch.setattr(backup, "backup_dir", lambda: backup_root)
    return {"db": db_file, "backup_dir": backup_root}


def _note(path: Path) -> str:
    conn = sqlite3.connect(str(path))
    try:
        row = conn.execute("SELECT note FROM demo").fetchone()
        return row[0] if row else ""
    finally:
        conn.close()


def test_create_backup(backup_env):
    row = backup.create_backup(keep=None)
    assert row["filename"].startswith("trade_estimating-")
    assert Path(row["path"]).exists()
    assert row["size_bytes"] > 0
    assert _note(Path(row["path"])) == "live-database-content"


def test_list_backups(backup_env):
    backup.create_backup(keep=None)
    rows = backup.list_backups()
    assert len(rows) == 1
    assert rows[0]["filename"].startswith("trade_estimating-")


def test_restore_backup_creates_pre_restore_copy(backup_env):
    created = backup.create_backup(keep=None)
    conn = sqlite3.connect(str(backup_env["db"]))
    conn.execute("UPDATE demo SET note = 'changed-live-data'")
    conn.commit()
    conn.close()

    result = backup.restore_backup(created["filename"])

    assert _note(backup_env["db"]) == "live-database-content"
    assert result["restored_from"] == created["filename"]
    assert result["pre_restore_backup"] is not None
    pre_restore = backup_env["backup_dir"] / result["pre_restore_backup"]
    assert _note(pre_restore) == "changed-live-data"


def test_restore_backup_without_existing_db(backup_env):
    created = backup.create_backup(keep=None)
    backup_env["db"].unlink()

    result = backup.restore_backup(created["filename"])

    assert backup_env["db"].exists()
    assert result["pre_restore_backup"] is None
    assert _note(backup_env["db"]) == "live-database-content"


def test_backup_file_path_rejects_traversal():
    with pytest.raises(HTTPException) as exc:
        backup.backup_file_path("../secret.db")
    assert exc.value.status_code == 400


def test_prune_backups_keeps_newest(backup_env):
    for _ in range(5):
        backup.create_backup(keep=None)
    deleted = backup.prune_backups(keep=2)
    assert deleted == 3
    assert len(backup.list_backups()) == 2


def test_login_throttle_locks_after_failures():
    from app.login_throttle import (
        assert_login_allowed,
        record_login_failure,
        reset_login_throttle_for_tests,
    )

    reset_login_throttle_for_tests()
    key = "127.0.0.1:test@example.com"
    for _ in range(8):
        record_login_failure(key)
    with pytest.raises(HTTPException) as exc:
        assert_login_allowed(key)
    assert exc.value.status_code == 429
    reset_login_throttle_for_tests()
