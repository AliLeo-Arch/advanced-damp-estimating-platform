"""Export rates to CSV. Usage: python scripts/export_rates.py [output.csv] [--include-inactive]"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, init_db
from app.rate_import import export_rates_to_csv

DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "data" / "rates_export.csv"


def main() -> int:
    parser = argparse.ArgumentParser(description="Export rates to CSV")
    parser.add_argument(
        "output",
        nargs="?",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output CSV path (default: {DEFAULT_OUTPUT})",
    )
    parser.add_argument(
        "--include-inactive",
        action="store_true",
        help="Include inactive rate lines",
    )
    args = parser.parse_args()

    init_db()
    db = SessionLocal()
    try:
        count = export_rates_to_csv(
            db,
            args.output,
            include_inactive=args.include_inactive,
        )
    finally:
        db.close()

    print(f"Exported {count} rates to {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
