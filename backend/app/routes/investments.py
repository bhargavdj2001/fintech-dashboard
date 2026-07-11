"""
Investment routes.
"""
import uuid
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_household_id
from app.schemas import (
    InvestmentIn,
    InvestmentOut,
    InvestmentTransactionIn,
    InvestmentUpdate,
)
from app.services import investment_service

router = APIRouter(prefix="/investments", tags=["Investments"])


@router.get("", response_model=List[InvestmentOut])
def list_investments(
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        return investment_service.get_investments(db, household_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("", response_model=InvestmentOut, status_code=201)
def create_investment(
    payload: InvestmentIn,
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        return investment_service.create_investment(db, payload, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/{investment_id}", response_model=InvestmentOut)
def update_investment(
    investment_id: UUID,
    payload: InvestmentUpdate,
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        investment = investment_service.update_investment(db, investment_id, payload, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    return investment


@router.delete("/{investment_id}", status_code=204)
def delete_investment(
    investment_id: UUID,
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        found = investment_service.delete_investment(db, investment_id, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not found:
        raise HTTPException(status_code=404, detail="Investment not found")


@router.post("/{investment_id}/transactions", response_model=InvestmentOut, status_code=201)
def add_investment_transaction(
    investment_id: UUID,
    payload: InvestmentTransactionIn,
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        investment = investment_service.create_investment_transaction(
            db, investment_id, payload, household_id
        )
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    return investment


@router.delete("/{investment_id}/transactions/{txn_id}", response_model=InvestmentOut)
def delete_investment_transaction(
    investment_id: UUID,
    txn_id: UUID,
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        investment = investment_service.delete_investment_transaction(
            db, investment_id, txn_id, household_id
        )
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not investment:
        raise HTTPException(status_code=404, detail="Investment or transaction not found")
    return investment
