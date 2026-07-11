"""
Routes — /settlements
"""
import uuid
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_household_id
from app.schemas import SettlementIn, SettlementOut
from app.services import settlement_service

router = APIRouter(prefix="/settlements", tags=["Settlements"])


@router.get("", response_model=List[SettlementOut])
def list_settlements(
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        return settlement_service.get_settlements(db, household_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("", response_model=SettlementOut, status_code=201)
def create_settlement(
    payload: SettlementIn,
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        return settlement_service.create_settlement(db, payload, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/{settlement_id}", status_code=204)
def delete_settlement(
    settlement_id: UUID,
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        found = settlement_service.delete_settlement(db, settlement_id, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not found:
        raise HTTPException(status_code=404, detail="Settlement not found")
