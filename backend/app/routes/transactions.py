"""
Routes — /transactions
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas import PaginatedTransactions, TransactionIn, TransactionOut, TransactionUpdate
from app.services import transaction_service

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("", response_model=PaginatedTransactions)
def list_transactions(
    start_date: Optional[datetime] = Query(None, description="Filter from this date (ISO 8601)"),
    end_date: Optional[datetime] = Query(None, description="Filter to this date (ISO 8601)"),
    account_id: Optional[UUID] = Query(None),
    category_id: Optional[UUID] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Return paginated transactions ordered by date descending."""
    try:
        result = transaction_service.get_transactions(
            db,
            start_date=start_date,
            end_date=end_date,
            account_id=account_id,
            category_id=category_id,
            limit=limit,
            offset=offset,
        )
        return PaginatedTransactions(
            total=result["total"],
            limit=limit,
            offset=offset,
            items=result["items"],
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{transaction_id}", response_model=TransactionOut)
def get_transaction(transaction_id: UUID, db: Session = Depends(get_db)):
    """Return a single transaction with its splits."""
    try:
        txn = transaction_service.get_transaction_by_id(db, transaction_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(payload: TransactionIn, db: Session = Depends(get_db)):
    """Create a new transaction, optionally with splits."""
    try:
        return transaction_service.create_transaction(db, payload)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/{transaction_id}", response_model=TransactionOut)
def update_transaction(transaction_id: UUID, payload: TransactionUpdate, db: Session = Depends(get_db)):
    """Update fields on an existing transaction."""
    try:
        txn = transaction_service.update_transaction(db, transaction_id, payload)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: UUID, db: Session = Depends(get_db)):
    """Delete a transaction by id."""
    try:
        found = transaction_service.delete_transaction(db, transaction_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not found:
        raise HTTPException(status_code=404, detail="Transaction not found")
