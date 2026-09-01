"""Run pricing benchmark validation (seed demo scenarios + custom historical jobs)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Allow `python scripts/validate_benchmarks.py` from backend/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.benchmark_jobs import run_all_benchmarks


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate pricing benchmark scenarios")
    parser.add_argument(
        "--tolerance",
        type=float,
        default=1.0,
        help="Sell price tolerance in GBP (default 1.00 for seed scenarios)",
    )
    args = parser.parse_args()

    checks = run_all_benchmarks(tolerance_gbp=args.tolerance)
    failed = 0
    for check in checks:
        status = "PASS" if check.passed else "FAIL"
        print(
            f"{status}  {check.scenario_id}  sell £{check.sell_price:,.2f}  "
            f"cost £{check.total_cost:,.2f}  margin {check.margin_percent:.2f}%"
        )
        if check.title:
            print(f"       {check.title}")
        for message in check.messages:
            print(f"       ! {message}")
        if not check.passed:
            failed += 1

    print(f"\n{len(checks) - failed}/{len(checks)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
