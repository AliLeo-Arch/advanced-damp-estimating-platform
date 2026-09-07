"""Lifecycle transition and approval helpers."""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.lifecycle import assert_transition, create_revision, resolve_status_after_pricing
from app.models import Estimate, EstimateStatus, User
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models  # noqa: F401
from app.database import Base


def test_allowed_transition():
    assert_transition("priced", "ready_to_quote")


def test_blocked_transition():
    with pytest.raises(HTTPException):
        assert_transition("draft", "quoted")


def test_override_requires_review():
    estimate = Estimate(
        reference="EST-TEST",
        customer_name="Test",
        override_sell_price=1000.0,
        below_target_margin=0,
        status=EstimateStatus.DRAFT.value,
    )
    assert resolve_status_after_pricing(estimate) == "review_required"


def test_below_target_requires_review():
    estimate = Estimate(
        reference="EST-TEST",
        customer_name="Test",
        override_sell_price=None,
        below_target_margin=1,
        status=EstimateStatus.DRAFT.value,
    )
    assert resolve_status_after_pricing(estimate) == "review_required"


def test_priced_when_healthy():
    estimate = Estimate(
        reference="EST-TEST",
        customer_name="Test",
        override_sell_price=None,
        below_target_margin=0,
        status=EstimateStatus.DRAFT.value,
    )
    assert resolve_status_after_pricing(estimate) == "priced"


def test_quoted_outcomes_allowed():
    for target in ("accepted", "declined", "expired", "closed"):
        assert_transition("quoted", target)


def test_revision_clears_quote_and_acceptance():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    actor = User(
        email="owner@example.com",
        full_name="Owner",
        password_hash="x",
        role="owner",
        active=1,
    )
    db.add(actor)
    db.flush()
    source = Estimate(
        reference="EST-100",
        customer_name="Demo Customer",
        status=EstimateStatus.QUOTED.value,
        revision_no=1,
        sell_price=1500.0,
        total_cost=1000.0,
        quotation_snapshot_json='{"sell_price": 1500}',
        accepted_by_name="Should clear",
        acceptance_method="email",
        acceptance_po_reference="PO-1",
        acceptance_notes="note",
    )
    db.add(source)
    db.commit()
    db.refresh(source)

    clone = create_revision(db, source, actor=actor)
    assert clone.status == "draft"
    assert clone.revision_no == 2
    assert clone.quote_issued_at is None
    assert clone.quotation_snapshot_json in ("", "{}")
    assert clone.accepted_by_name == ""
    assert clone.acceptance_method == ""
    assert clone.acceptance_po_reference == ""
    assert clone.parent_estimate_id == source.id
