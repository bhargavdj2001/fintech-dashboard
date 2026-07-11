"""
Recurring rules service — CRUD operations plus materialization (turning a
due rule into a real Transaction).
"""
import datetime as dt
from typing import Optional
from uuid import UUID, uuid4

from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import Session

from app.models import RecurringRule, Transaction
from app.schemas import RecurringIn, RecurringUpdate

_FREQ_DELTA = {
    "daily": relativedelta(days=1),
    "weekly": relativedelta(weeks=1),
    "monthly": relativedelta(months=1),
    "yearly": relativedelta(years=1),
}


def get_recurring_rules(db: Session, household_id: UUID) -> list:
    return (
        db.query(RecurringRule)
        .filter(RecurringRule.household_id == household_id)
        .order_by(RecurringRule.next_run_at.asc().nullslast())
        .all()
    )


def create_recurring_rule(
    db: Session, payload: RecurringIn, household_id: UUID
) -> RecurringRule:
    rule = RecurringRule(
        id=uuid4(),
        household_id=household_id,
        freq=payload.freq,
        is_active=payload.is_active,
        next_run_at=payload.next_run_at,
        template_txn={
            "title": payload.title,
            "amount": payload.amount,
            "type": payload.type,
            "account_id": str(payload.account_id) if payload.account_id else None,
            "category_id": str(payload.category_id) if payload.category_id else None,
        },
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


def update_recurring_rule(
    db: Session, rule_id: UUID, payload: RecurringUpdate, household_id: UUID
) -> Optional[RecurringRule]:
    rule = db.query(RecurringRule).filter(RecurringRule.id == rule_id).first()
    if not rule:
        return None
    if rule.household_id != household_id:
        return None
    data = payload.model_dump(exclude_none=True)
    for key, val in data.items():
        setattr(rule, key, val)
    db.commit()
    db.refresh(rule)
    return rule


def delete_recurring_rule(db: Session, rule_id: UUID, household_id: UUID) -> bool:
    rule = db.query(RecurringRule).filter(RecurringRule.id == rule_id).first()
    if not rule:
        return False
    if rule.household_id != household_id:
        return False
    db.delete(rule)
    db.commit()
    return True


def materialize_due_rules(db: Session) -> int:
    """
    Find active recurring rules whose next_run_at has passed, create a real
    Transaction from template_txn for each, and advance next_run_at.
    Returns the number of transactions created.
    """
    now = dt.datetime.now(dt.timezone.utc)
    due_rules = (
        db.query(RecurringRule)
        .filter(
            RecurringRule.is_active.is_(True),
            RecurringRule.next_run_at.isnot(None),
            RecurringRule.next_run_at <= now,
        )
        .all()
    )
    created_count = 0
    for rule in due_rules:
        tpl = rule.template_txn or {}
        if not tpl.get("account_id") or not tpl.get("amount") or not tpl.get("title"):
            continue  # malformed template — skip, don't crash the batch
        txn = Transaction(
            id=uuid4(),
            household_id=rule.household_id,
            account_id=tpl["account_id"],
            title=tpl["title"],
            amount=tpl["amount"],
            type=tpl.get("type", "expense"),
            category_id=tpl.get("category_id"),
            occurred_at=rule.next_run_at,
            is_recurring_instance=True,
            recurring_rule_id=rule.id,
        )
        db.add(txn)
        delta = _FREQ_DELTA.get(rule.freq, relativedelta(months=1))
        rule.next_run_at = rule.next_run_at + delta
        created_count += 1
    db.commit()
    return created_count
