"""Import rates from CSV. Usage: python scripts/import_rates.py path/to/rates.csv [--dry-run]"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, init_db
from app.rate_import import import_rates_from_csv


def main() -> int:
    parser = argparse.ArgumentParser(description="Import or update rates from CSV")
    parser.add_argument("csv_path", type=Path, help="Path to rates CSV file")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate file without saving changes",
    )
    args = parser.parse_args()

    if not args.csv_path.exists():
        print(f"File not found: {args.csv_path}", file=sys.stderr)
        return 1

    init_db()
    db = SessionLocal()
    try:
        result = import_rates_from_csv(db, args.csv_path, dry_run=args.dry_run)
    finally:
        db.close()

    mode = "DRY RUN" if args.dry_run else "IMPORT"
    print(f"{mode}: {args.csv_path}")
    print(f"  created: {result.created}")
    print(f"  updated: {result.updated}")
    print(f"  skipped: {result.skipped}")

    if result.errors:
        print("Errors:", file=sys.stderr)
        for err in result.errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
