"""
Budget service — CRUD operations for budgets, plus period-aware spend and
carry-over computation.
"""
import calendar
import datetime as dt
from typing import Optional, Tuple
from uuid import UUID, uuid4

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models import Budget, Transaction
from app.schemas import BudgetIn, BudgetUpdate


def _period_window(period_type: str) -> Tuple[dt.datetime, dt.datetime]:
    """Current period boundary, relative to today — monthly: this calendar
    month, yearly: this calendar year. Anchored to today, not start_date."""
    now = dt.datetime.now(dt.timezone.utc)
    today = dt.date.today()
    if period_type == "yearly":
        start = dt.datetime(today.year, 1, 1, tzinfo=dt.timezone.utc)
    else:
        start = dt.datetime(today.year, today.month, 1, tzinfo=dt.timezone.utc)
    return start, now


def _previous_period_window(period_type: str) -> Tuple[dt.datetime, dt.datetime]:
    """The full period immediately before the current one."""
    today = dt.date.today()
    if period_type == "yearly":
        start = dt.datetime(today.year - 1, 1, 1, tzinfo=dt.timezone.utc)
        end = dt.datetime(today.year - 1, 12, 31, 23, 59, 59, tzinfo=dt.timezone.utc)
        return start, end
    prev_year, prev_month = (today.year - 1, 12) if today.month == 1 else (today.year, today.month - 1)
    start = dt.datetime(prev_year, prev_month, 1, tzinfo=dt.timezone.utc)
    last_day = calendar.monthrange(prev_year, prev_month)[1]
    end = dt.datetime(prev_year, prev_month, last_day, 23, 59, 59, tzinfo=dt.timezone.utc)
    return start, end


def _spent_in_window(db: Session, category_id, start: dt.datetime, end: dt.datetime) -> float:
    if not category_id:
        return 0.0
    total = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.type == "expense",
            Transaction.category_id == category_id,
            Transaction.occurred_at >= start,
            Transaction.occurred_at <= end,
        )
        .scalar()
    )
    return float(total or 0)


def _compute_spent_by_category(db: Session) -> dict:
    """
    Current-calendar-month spend per category, regardless of any budget's
    period_type. Used by insights_service for cross-budget "this month"
    checks, which don't need per-budget period awareness.
    """
    start, end = _period_window("monthly")
    results = (
        db.query(Transaction.category_id, func.sum(Transaction.amount))
        .filter(
            Transaction.type == "expense",
            Transaction.occurred_at >= start,
            Transaction.occurred_at <= end,
        )
        .group_by(Transaction.category_id)
        .all()
    )
    return {str(cat_id): float(total) for cat_id, total in results if cat_id}


def _attach_computed_fields(db: Session, budget: Budget) -> Budget:
    start, end = _period_window(budget.period_type)
    budget.spent = _spent_in_window(db, budget.category_id, start, end)
    rollover = 0.0
    if budget.carry_over:
        prev_start, prev_end = _previous_period_window(budget.period_type)
        prev_spent = _spent_in_window(db, budget.category_id, prev_start, prev_end)
        rollover = max(0.0, float(budget.amount) - prev_spent)
    budget.rollover_amount = rollover
    budget.effective_amount = float(budget.amount) + rollover
    return budget


def get_budgets(db: Session, household_id: UUID) -> list:
    budgets = (
        db.query(Budget)
        .options(joinedload(Budget.category))
        .filter(Budget.household_id == household_id)
        .order_by(Budget.created_at.desc())
        .all()
    )
    for budget in budgets:
        _attach_computed_fields(db, budget)
    return budgets


def create_budget(db: Session, payload: BudgetIn, household_id: UUID) -> Budget:
    budget = Budget(
        id=uuid4(),
        household_id=household_id,
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
    return _attach_computed_fields(db, result)


def update_budget(db: Session, budget_id: UUID, payload: BudgetUpdate, household_id: UUID) -> Optional[Budget]:
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.household_id == household_id).first()
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
    return _attach_computed_fields(db, result)


def delete_budget(db: Session, budget_id: UUID, household_id: UUID) -> bool:
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.household_id == household_id).first()
    if not budget:
        return False
    db.delete(budget)
    db.commit()
    return True
