"""
Routes — /accounts
"""
import uuid
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_household_id
from app.models import Account
from app.schemas import AccountBalanceUpdate, AccountIn, AccountOut
from app.services import account_service
from app.services.account_service import AccountInUseError

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.get("", response_model=List[AccountOut])
def list_accounts(
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    """Return all accounts for the current household ordered by name."""
    try:
        return account_service.get_accounts(db, household_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("", response_model=AccountOut, status_code=201)
def create_account(
    payload: AccountIn,
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    # Force the payload's household_id to match the authenticated user's household
    payload.household_id = household_id
    try:
        return account_service.create_account(db, payload)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


@router.patch("/{account_id}/balance", response_model=AccountOut)
def update_account_balance(
    account_id: UUID,
    payload: AccountBalanceUpdate,
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    """
    Set an account's CURRENT balance to the given value (e.g. Cash accounts,
    where you just tell the app what you have). opening_balance is
    back-solved so the live computation lands on exactly this number.
    """
    try:
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account or account.household_id != household_id:
            raise HTTPException(status_code=404, detail="Account not found")
        return account_service.set_current_balance(db, account, payload.balance)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/{account_id}", status_code=204)
def delete_account(
    account_id: UUID,
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.household_id == household_id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    try:
        found = account_service.delete_account(db, account_id)
    except AccountInUseError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not found:
        raise HTTPException(status_code=404, detail="Account not found")
