"""
Transaction service — all database operations for transactions.
Routes delegate here; this layer is the only place that touches ORM models.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models import Transaction, TransactionSplit
from app.schemas import TransactionIn, TransactionUpdate


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _with_relations(q):
    """Attach eager-loaded relations to a Transaction query."""
    return q.options(
        joinedload(Transaction.account),
        joinedload(Transaction.category),
        joinedload(Transaction.splits).joinedload(TransactionSplit.profile),
    )


def _apply_filters(q, start_date, end_date, account_id, category_id):
    """Apply common filter predicates (works on any Transaction query)."""
    if start_date:
        q = q.filter(Transaction.occurred_at >= start_date)
    if end_date:
        q = q.filter(Transaction.occurred_at <= end_date)
    if account_id:
        q = q.filter(Transaction.account_id == account_id)
    if category_id:
        q = q.filter(Transaction.category_id == category_id)
    return q


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_transactions(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    account_id: Optional[UUID] = None,
    category_id: Optional[UUID] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    """
    Return paginated transactions, newest first.

    Count is computed with a lightweight scalar query (no joins) to avoid
    the duplicate-row issue that joinedload causes on COUNT(*).
    """
    count_q = _apply_filters(
        db.query(func.count(Transaction.id)),
        start_date, end_date, account_id, category_id,
    )
    total = count_q.scalar() or 0

    data_q = _apply_filters(
        _with_relations(db.query(Transaction)),
        start_date, end_date, account_id, category_id,
    )
    items = data_q.order_by(Transaction.occurred_at.desc()).limit(limit).offset(offset).all()

    return {"total": total, "items": items}


def get_transaction_by_id(db: Session, transaction_id: UUID) -> Optional[Transaction]:
    """Return a single transaction with its splits, or None."""
    return (
        _with_relations(db.query(Transaction))
        .filter(Transaction.id == transaction_id)
        .first()
    )


def create_transaction(db: Session, payload: TransactionIn) -> Transaction:
    """
    Insert a transaction row and optional split rows in one DB round-trip.
    Only uses columns that exist in the real database schema.
    """
    txn = Transaction(
        id=uuid4(),
        household_id=payload.household_id,
        account_id=payload.account_id,
        category_id=payload.category_id,
        created_by_profile_id=payload.created_by_profile_id,
        title=payload.title,
        description=payload.description,
        amount=payload.amount,
        currency=payload.currency,
        type=payload.type,
        occurred_at=payload.occurred_at,
        merchant=payload.merchant,
        status=payload.status,
    )
    db.add(txn)
    db.flush()  # obtain PK before inserting child rows

    for split_in in payload.splits:
        db.add(TransactionSplit(
            id=uuid4(),
            transaction_id=txn.id,
            profile_id=split_in.profile_id,
            share_amount=split_in.share_amount,
            share_percent=split_in.share_percent,
            paid_amount=split_in.paid_amount,
        ))

    db.commit()
    db.refresh(txn)
    return get_transaction_by_id(db, txn.id)


def update_transaction(db: Session, transaction_id: UUID, payload: TransactionUpdate) -> Optional[Transaction]:
    """Update allowed fields on an existing transaction."""
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        return None
    data = payload.model_dump(exclude_none=True)
    for key, val in data.items():
        setattr(txn, key, val)
    db.commit()
    return get_transaction_by_id(db, transaction_id)


def delete_transaction(db: Session, transaction_id: UUID) -> bool:
    """Delete a transaction by id. Returns True if deleted, False if not found."""
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        return False
    db.delete(txn)
    db.commit()
    return True
