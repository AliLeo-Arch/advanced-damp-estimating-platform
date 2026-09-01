"""Reset a user password by email."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.auth import hash_password
from app.database import SessionLocal, init_db
from app.models import User


def main() -> int:
    parser = argparse.ArgumentParser(description="Reset user password")
    parser.add_argument("email", help="User email address")
    parser.add_argument("password", help="New password (min 8 characters)")
    args = parser.parse_args()

    if len(args.password) < 8:
        print("Password must be at least 8 characters.", file=sys.stderr)
        return 1

    init_db()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == args.email.lower().strip()).one_or_none()
        if not user:
            print(f"User not found: {args.email}", file=sys.stderr)
            return 1
        user.password_hash = hash_password(args.password)
        db.commit()
        print(f"Password updated for {user.email} ({user.role}).")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
