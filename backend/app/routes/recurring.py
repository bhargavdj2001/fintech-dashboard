"""
Recurring rules routes.
"""
import uuid
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_household_id
from app.schemas import RecurringIn, RecurringRuleOut, RecurringUpdate
from app.services import recurring_service

router = APIRouter(prefix="/recurring", tags=["Recurring"])


@router.get("", response_model=List[RecurringRuleOut])
def list_recurring(
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        return recurring_service.get_recurring_rules(db, household_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("", response_model=RecurringRuleOut, status_code=201)
def create_recurring(
    payload: RecurringIn,
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        return recurring_service.create_recurring_rule(db, payload, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/{rule_id}", response_model=RecurringRuleOut)
def update_recurring(
    rule_id: UUID,
    payload: RecurringUpdate,
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        rule = recurring_service.update_recurring_rule(db, rule_id, payload, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not rule:
        raise HTTPException(status_code=404, detail="Recurring rule not found")
    return rule


@router.delete("/{rule_id}", status_code=204)
def delete_recurring(
    rule_id: UUID,
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        found = recurring_service.delete_recurring_rule(db, rule_id, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not found:
        raise HTTPException(status_code=404, detail="Recurring rule not found")


@router.post("/run-due")
def run_due_rules(db: Session = Depends(get_db)):
    """
    Manually trigger materialization of any due recurring rules, so
    dev/tests don't have to wait for the hourly scheduler tick. The
    scheduler (see app/main.py) calls the same service function automatically.
    """
    try:
        count = recurring_service.materialize_due_rules(db)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    return {"created": count}
