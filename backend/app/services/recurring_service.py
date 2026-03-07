"""
Recurring rules service — CRUD operations.
"""
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models import RecurringRule
from app.schemas import RecurringIn, RecurringUpdate


def get_recurring_rules(db: Session) -> list:
    return (
        db.query(RecurringRule)
        .order_by(RecurringRule.next_run_at.asc().nullslast())
        .all()
    )


def create_recurring_rule(db: Session, payload: RecurringIn) -> RecurringRule:
    rule = RecurringRule(
        id=uuid4(),
        household_id=payload.household_id,
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


def update_recurring_rule(db: Session, rule_id: UUID, payload: RecurringUpdate) -> Optional[RecurringRule]:
    rule = db.query(RecurringRule).filter(RecurringRule.id == rule_id).first()
    if not rule:
        return None
    data = payload.model_dump(exclude_none=True)
    for key, val in data.items():
        setattr(rule, key, val)
    db.commit()
    db.refresh(rule)
    return rule


def delete_recurring_rule(db: Session, rule_id: UUID) -> bool:
    rule = db.query(RecurringRule).filter(RecurringRule.id == rule_id).first()
    if not rule:
        return False
    db.delete(rule)
    db.commit()
    return True
