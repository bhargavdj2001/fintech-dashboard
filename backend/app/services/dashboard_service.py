"""
Dashboard service — aggregate stats for the summary endpoint.
"""
from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models import Account, Transaction, TransactionSplit
from app.services.account_service import attach_current_balances


def _month_bounds():
    """Return (start, end) for the current calendar month (UTC)."""
    now = datetime.now(tz=timezone.utc)
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    # end = now (up to this moment in the month)
    return start, now


def get_dashboard_summary(db: Session, household_id: UUID) -> dict:
    """
    Compute:
      - total_balance          sum of all account balances
      - monthly_income         income transactions this calendar month
      - monthly_expense        expense transactions this calendar month
      - net_cashflow           monthly_income - monthly_expense
      - recent_transactions    last 5 transactions (with relations)
      - category_breakdown     { category_name: total_amount } for current month expenses
    """
    # --- total balance ---
    accounts = attach_current_balances(
        db, db.query(Account).filter(Account.household_id == household_id).all()
    )
    total_balance = Decimal(str(sum(a.current_balance for a in accounts)))

    # --- monthly income / expense ---
    start, end = _month_bounds()

    income_row = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.household_id == household_id,
            Transaction.type == "income",
            Transaction.occurred_at >= start,
            Transaction.occurred_at <= end,
        )
        .scalar()
    )
    monthly_income = income_row or Decimal("0")

    expense_row = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.household_id == household_id,
            Transaction.type == "expense",
            Transaction.occurred_at >= start,
            Transaction.occurred_at <= end,
        )
        .scalar()
    )
    monthly_expense = expense_row or Decimal("0")

    # --- recent transactions (last 5) ---
    recent = (
        db.query(Transaction)
        .options(
            joinedload(Transaction.account),
            joinedload(Transaction.category),
            joinedload(Transaction.splits).joinedload(TransactionSplit.profile),
        )
        .filter(Transaction.household_id == household_id)
        .order_by(Transaction.occurred_at.desc())
        .limit(5)
        .all()
    )

    # --- category breakdown for current month expenses ---
    expense_txns = (
        db.query(Transaction)
        .options(joinedload(Transaction.category))
        .filter(
            Transaction.household_id == household_id,
            Transaction.type == "expense",
            Transaction.occurred_at >= start,
            Transaction.occurred_at <= end,
        )
        .all()
    )

    category_breakdown: dict[str, Decimal] = {}
    for txn in expense_txns:
        key = txn.category.name if txn.category else "Uncategorized"
        category_breakdown[key] = category_breakdown.get(key, Decimal("0")) + (txn.amount or Decimal("0"))

    return {
        "total_balance": float(total_balance),
        "monthly_income": float(monthly_income),
        "monthly_expense": float(monthly_expense),
        "net_cashflow": float(monthly_income - monthly_expense),
        "recent_transactions": recent,
        "category_breakdown": {k: float(v) for k, v in category_breakdown.items()},
    }
