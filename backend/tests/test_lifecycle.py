"""Lifecycle transition and approval helpers."""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.lifecycle import assert_transition, resolve_status_after_pricing
from app.models import Estimate, EstimateStatus


def test_allowed_transition():
    assert_transition("priced", "ready_to_quote")


def test_blocked_transition():
    with pytest.raises(HTTPException):
        assert_transition("draft", "quoted")


def test_override_requires_review():
    estimate = Estimate(
        reference="AD-TEST",
        customer_name="Test",
        override_sell_price=1000.0,
        below_target_margin=0,
        status=EstimateStatus.DRAFT.value,
    )
    assert resolve_status_after_pricing(estimate) == "review_required"


def test_below_target_requires_review():
    estimate = Estimate(
        reference="AD-TEST",
        customer_name="Test",
        override_sell_price=None,
        below_target_margin=1,
        status=EstimateStatus.DRAFT.value,
    )
    assert resolve_status_after_pricing(estimate) == "review_required"


def test_priced_when_healthy():
    estimate = Estimate(
        reference="AD-TEST",
        customer_name="Test",
        override_sell_price=None,
        below_target_margin=0,
        status=EstimateStatus.DRAFT.value,
    )
    assert resolve_status_after_pricing(estimate) == "priced"
