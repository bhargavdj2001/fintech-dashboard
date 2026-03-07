"""
Routes — /accounts
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import Account
from app.schemas import AccountBalanceUpdate, AccountOut

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.get("", response_model=List[AccountOut])
def list_accounts(db: Session = Depends(get_db)):
    """Return all accounts ordered by name."""
    try:
        return db.query(Account).order_by(Account.name).all()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.patch("/{account_id}/balance", response_model=AccountOut)
def update_account_balance(account_id: UUID, payload: AccountBalanceUpdate, db: Session = Depends(get_db)):
    """Update the balance of a cash/manual account."""
    try:
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        account.balance = payload.balance
        db.commit()
        db.refresh(account)
        return account
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
