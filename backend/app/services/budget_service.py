"""
Budget service — CRUD operations for budgets.
"""
import datetime as dt
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models import Budget, Transaction
from app.schemas import BudgetIn, BudgetUpdate


def _compute_spent_by_category(db: Session) -> dict:
    """Return a mapping of category_id str -> total expense amount for the current month."""
    now = dt.date.today()
    start_of_month = dt.datetime(now.year, now.month, 1, tzinfo=dt.timezone.utc)
    results = (
        db.query(Transaction.category_id, func.sum(Transaction.amount))
        .filter(
            Transaction.type == "expense",
            Transaction.occurred_at >= start_of_month,
        )
        .group_by(Transaction.category_id)
        .all()
    )
    return {str(cat_id): float(total) for cat_id, total in results if cat_id}


def get_budgets(db: Session) -> list:
    budgets = (
        db.query(Budget)
        .options(joinedload(Budget.category))
        .order_by(Budget.created_at.desc())
        .all()
    )
    spent_map = _compute_spent_by_category(db)
    for budget in budgets:
        budget.spent = spent_map.get(str(budget.category_id), 0.0) if budget.category_id else 0.0
    return budgets


def create_budget(db: Session, payload: BudgetIn) -> Budget:
    budget = Budget(
        id=uuid4(),
        household_id=payload.household_id,
        name=payload.name,
        category_id=payload.category_id,
        amount=payload.amount,
        period_type=payload.period_type,
        carry_over=payload.carry_over,
        start_date=payload.start_date,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    result = (
        db.query(Budget)
        .options(joinedload(Budget.category))
        .filter(Budget.id == budget.id)
        .first()
    )
    result.spent = 0.0
    return result


def update_budget(db: Session, budget_id: UUID, payload: BudgetUpdate) -> Optional[Budget]:
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        return None
    data = payload.model_dump(exclude_none=True)
    for key, val in data.items():
        setattr(budget, key, val)
    db.commit()
    result = (
        db.query(Budget)
        .options(joinedload(Budget.category))
        .filter(Budget.id == budget_id)
        .first()
    )
    spent_map = _compute_spent_by_category(db)
    result.spent = spent_map.get(str(result.category_id), 0.0) if result.category_id else 0.0
    return result


def delete_budget(db: Session, budget_id: UUID) -> bool:
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        return False
    db.delete(budget)
    db.commit()
    return True
