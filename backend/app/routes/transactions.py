"""
Routes — /transactions
"""
import uuid
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_household_id
from app.schemas import (
    ImportResultOut,
    PaginatedTransactions,
    TransactionIn,
    TransactionOut,
    TransactionUpdate,
    TransferIn,
    TransferOut,
)
from app.services import import_service, receipt_service, transaction_service
from app.services.receipt_service import InvalidReceiptError
from app.services.transaction_service import TransferIsImmutableError

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("", response_model=PaginatedTransactions)
def list_transactions(
    start_date: Optional[datetime] = Query(None, description="Filter from this date (ISO 8601)"),
    end_date: Optional[datetime] = Query(None, description="Filter to this date (ISO 8601)"),
    account_id: Optional[UUID] = Query(None),
    category_id: Optional[UUID] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    """Return paginated transactions for the current household ordered by date descending."""
    try:
        result = transaction_service.get_transactions(
            db,
            household_id=household_id,
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
def get_transaction(
    transaction_id: UUID,
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    """Return a single transaction with its splits."""
    try:
        txn = transaction_service.get_transaction_by_id(db, transaction_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    if not txn or txn.household_id != household_id:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(
    payload: TransactionIn,
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    """Create a new transaction, optionally with splits."""
    try:
        return transaction_service.create_transaction(db, payload, household_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/transfer", response_model=TransferOut, status_code=201)
def create_transfer(
    payload: TransferIn,
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    """Create a real paired transfer between two accounts."""
    # Force the transfer's household_id to match the authenticated user's
    payload.household_id = household_id
    try:
        result = transaction_service.create_transfer(db, payload)
        return result
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/{transaction_id}", response_model=TransactionOut)
def update_transaction(
    transaction_id: UUID,
    payload: TransactionUpdate,
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    """Update fields on an existing transaction."""
    # Verify ownership before allowing update
    existing = transaction_service.get_transaction_by_id(db, transaction_id)
    if not existing or existing.household_id != household_id:
        raise HTTPException(status_code=404, detail="Transaction not found")
    try:
        txn = transaction_service.update_transaction(db, transaction_id, payload)
    except TransferIsImmutableError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: UUID,
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    """Delete a transaction by id. Deletes both sides if it's a transfer."""
    try:
        deleted_ids = transaction_service.delete_transaction(db, transaction_id, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not deleted_ids:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"deleted_ids": [str(i) for i in deleted_ids]}


@router.delete("", status_code=204)
def delete_all_transactions(
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    """Danger zone — delete every transaction (and its splits/tags)."""
    try:
        transaction_service.delete_all_transactions(db)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/{transaction_id}/receipt", response_model=TransactionOut)
async def upload_receipt(
    transaction_id: UUID,
    file: UploadFile = File(...),
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    """Attach a receipt (image or PDF) to a transaction. Stored on local disk."""
    existing = transaction_service.get_transaction_by_id(db, transaction_id)
    if not existing or existing.household_id != household_id:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if existing.receipt_url:
        receipt_service.delete_receipt_file(existing.receipt_url)
    contents = await file.read()
    try:
        url = receipt_service.save_receipt(file.filename, file.content_type, contents)
    except InvalidReceiptError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return transaction_service.set_receipt_url(db, transaction_id, url)


@router.delete("/{transaction_id}/receipt", response_model=TransactionOut)
def delete_receipt(
    transaction_id: UUID,
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    """Remove a transaction's receipt."""
    existing = transaction_service.get_transaction_by_id(db, transaction_id)
    if not existing or existing.household_id != household_id:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if existing.receipt_url:
        receipt_service.delete_receipt_file(existing.receipt_url)
    return transaction_service.clear_receipt_url(db, transaction_id)


@router.post("/import", response_model=ImportResultOut)
async def import_transactions(
    file: UploadFile = File(...),
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    """
    Bulk-import transactions from a CSV file. Expected columns: date,
    title, amount, type (income|expense|transfer), and optionally
    account, category.
    """
    contents = await file.read()
    try:
        return import_service.import_transactions_csv(db, household_id, contents)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
