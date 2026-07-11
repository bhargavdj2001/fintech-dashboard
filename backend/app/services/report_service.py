"""
Report service — period-based financial summaries.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models import Category, Transaction, TransactionSplit
from app.utils import safe_decimal


def get_period_report(
    db: Session,
    household_id: UUID,
    start_date: Optional[datetime],
    end_date: Optional[datetime],
) -> dict:
    """
    Return a financial summary for the requested date range.

    Includes:
      - total_income, total_expense, net_cashflow
      - transaction_count
      - category_summary  { category_name: total_amount }
      - transactions      (full list, newest first)
    """
    q = (
        db.query(Transaction)
        .options(
            joinedload(Transaction.account),
            joinedload(Transaction.category),
            joinedload(Transaction.splits).joinedload(TransactionSplit.profile),
        )
        .filter(Transaction.household_id == household_id)
    )

    if start_date:
        q = q.filter(Transaction.occurred_at >= start_date)
    if end_date:
        q = q.filter(Transaction.occurred_at <= end_date)

    transactions = q.order_by(Transaction.occurred_at.desc()).all()

    total_income = Decimal("0")
    total_expense = Decimal("0")
    category_summary: dict[str, Decimal] = {}

    for txn in transactions:
        amount = safe_decimal(txn.amount)
        if txn.type == "income":
            total_income += amount
        elif txn.type == "expense":
            total_expense += amount

        if txn.category:
            cat_name = txn.category.name
            category_summary[cat_name] = category_summary.get(cat_name, Decimal("0")) + amount

    return {
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "net_cashflow": float(total_income - total_expense),
        "transaction_count": len(transactions),
        "category_summary": {k: float(v) for k, v in category_summary.items()},
        "transactions": transactions,
    }
