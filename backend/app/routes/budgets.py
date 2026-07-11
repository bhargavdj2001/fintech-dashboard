"""
Budget routes.
"""
import uuid
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_household_id
from app.schemas import BudgetIn, BudgetOut, BudgetUpdate
from app.services import budget_service

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.get("", response_model=List[BudgetOut])
def list_budgets(
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    try:
        return budget_service.get_budgets(db, household_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("", response_model=BudgetOut, status_code=201)
def create_budget(
    payload: BudgetIn,
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    try:
        return budget_service.create_budget(db, payload, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/{budget_id}", response_model=BudgetOut)
def update_budget(
    budget_id: UUID,
    payload: BudgetUpdate,
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    try:
        budget = budget_service.update_budget(db, budget_id, payload, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget


@router.delete("/{budget_id}", status_code=204)
def delete_budget(
    budget_id: UUID,
    household_id: uuid.UUID = Depends(get_current_household_id),
    db: Session = Depends(get_db),
):
    try:
        found = budget_service.delete_budget(db, budget_id, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not found:
        raise HTTPException(status_code=404, detail="Budget not found")
