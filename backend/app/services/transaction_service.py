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

from app.models import Account, Transaction, TransactionSplit
from app.schemas import TransactionIn, TransactionUpdate, TransferIn


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


def _apply_filters(q, household_id, start_date, end_date, account_id, category_id):
    """Apply common filter predicates (works on any Transaction query)."""
    q = q.filter(Transaction.household_id == household_id)
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
    household_id: UUID,
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
        household_id, start_date, end_date, account_id, category_id,
    )
    total = count_q.scalar() or 0

    data_q = _apply_filters(
        _with_relations(db.query(Transaction)),
        household_id, start_date, end_date, account_id, category_id,
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


def create_transaction(db: Session, payload: TransactionIn, household_id: UUID) -> Transaction:
    """
    Insert a transaction row and optional split rows in one DB round-trip.
    Only uses columns that exist in the real database schema.
    Validates that the target account belongs to the authenticated household.
    """
    account = db.query(Account).filter(
        Account.id == payload.account_id,
        Account.household_id == household_id,
    ).first()
    if not account:
        raise ValueError("Account not found or does not belong to this household")
    txn = Transaction(
        id=uuid4(),
        household_id=household_id,
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


class TransferIsImmutableError(Exception):
    """Raised when trying to edit a transfer through the generic update endpoint."""


def update_transaction(db: Session, transaction_id: UUID, payload: TransactionUpdate) -> Optional[Transaction]:
    """Update allowed fields on an existing transaction."""
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        return None
    if txn.transfer_group_id is not None:
        raise TransferIsImmutableError(
            "Transfers can't be edited — delete it and create a new one instead"
        )
    data = payload.model_dump(exclude_none=True)
    for key, val in data.items():
        setattr(txn, key, val)
    db.commit()
    return get_transaction_by_id(db, transaction_id)


def create_transfer(db: Session, payload: TransferIn) -> dict:
    """
    Create a real paired transfer: two Transaction rows sharing a
    transfer_group_id, signed so account balances move correctly —
    negative on the source account, positive on the destination.
    """
    from_account = db.query(Account).filter(Account.id == payload.from_account_id).first()
    to_account = db.query(Account).filter(Account.id == payload.to_account_id).first()
    group_id = uuid4()

    from_txn = Transaction(
        id=uuid4(),
        household_id=payload.household_id,
        account_id=payload.from_account_id,
        created_by_profile_id=payload.created_by_profile_id,
        title=payload.title or f"Transfer to {to_account.name if to_account else 'account'}",
        amount=-payload.amount,
        currency=payload.currency,
        type="transfer",
        occurred_at=payload.occurred_at,
        status=payload.status,
        transfer_group_id=group_id,
    )
    to_txn = Transaction(
        id=uuid4(),
        household_id=payload.household_id,
        account_id=payload.to_account_id,
        created_by_profile_id=payload.created_by_profile_id,
        title=payload.title or f"Transfer from {from_account.name if from_account else 'account'}",
        amount=payload.amount,
        currency=payload.currency,
        type="transfer",
        occurred_at=payload.occurred_at,
        status=payload.status,
        transfer_group_id=group_id,
    )
    db.add(from_txn)
    db.add(to_txn)
    db.commit()
    return {
        "from_transaction": get_transaction_by_id(db, from_txn.id),
        "to_transaction": get_transaction_by_id(db, to_txn.id),
    }


def delete_transaction(db: Session, transaction_id: UUID, household_id: UUID) -> List[UUID]:
    """
    Delete a transaction by id. If it's one side of a transfer, deletes both
    sides atomically. Returns the list of deleted ids (empty if not found or
    the transaction belongs to a different household).
    """
    txn = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.household_id == household_id,
    ).first()
    if not txn:
        return []
    if txn.transfer_group_id is not None:
        pair = db.query(Transaction).filter(Transaction.transfer_group_id == txn.transfer_group_id).all()
        ids = [t.id for t in pair]
        for t in pair:
            db.delete(t)
        db.commit()
        return ids
    db.delete(txn)
    db.commit()
    return [transaction_id]


def delete_all_transactions(db: Session) -> None:
    """Danger zone — wipe every transaction (splits cascade via FK)."""
    db.query(TransactionSplit).delete()
    db.query(Transaction).delete()
    db.commit()


def set_receipt_url(db: Session, transaction_id: UUID, url: str) -> Optional[Transaction]:
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        return None
    txn.receipt_url = url
    db.commit()
    return get_transaction_by_id(db, transaction_id)


def clear_receipt_url(db: Session, transaction_id: UUID) -> Optional[Transaction]:
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        return None
    txn.receipt_url = None
    db.commit()
    return get_transaction_by_id(db, transaction_id)
