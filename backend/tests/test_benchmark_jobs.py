"""Benchmark validation tests using seeded demo scenarios."""

from __future__ import annotations

from app.benchmark_jobs import load_demo_scenarios, run_all_benchmarks, validate_scenario


def test_all_demo_scenarios_pass():
    checks = run_all_benchmarks()
    assert len(checks) >= 5
    failures = [c for c in checks if not c.passed]
    assert not failures, failures


def test_demo_05_applies_minimum_job():
    scenarios = load_demo_scenarios()
    demo05 = next(s for s in scenarios if s["id"] == "DEMO-05")
    check = validate_scenario(demo05)
    assert check.passed
    assert check.sell_price == 750.0


def test_demo_01_reconciles_lines():
    scenarios = load_demo_scenarios()
    demo01 = next(s for s in scenarios if s["id"] == "DEMO-01")
    check = validate_scenario(demo01)
    assert check.passed
    assert check.sell_price > 750.0
