"""
Recurring rules routes.
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import RecurringIn, RecurringRuleOut, RecurringUpdate
from app.services import recurring_service

router = APIRouter(prefix="/recurring", tags=["Recurring"])


@router.get("", response_model=List[RecurringRuleOut])
def list_recurring(db: Session = Depends(get_db)):
    try:
        return recurring_service.get_recurring_rules(db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("", response_model=RecurringRuleOut, status_code=201)
def create_recurring(payload: RecurringIn, db: Session = Depends(get_db)):
    try:
        return recurring_service.create_recurring_rule(db, payload)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/{rule_id}", response_model=RecurringRuleOut)
def update_recurring(rule_id: UUID, payload: RecurringUpdate, db: Session = Depends(get_db)):
    try:
        rule = recurring_service.update_recurring_rule(db, rule_id, payload)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not rule:
        raise HTTPException(status_code=404, detail="Recurring rule not found")
    return rule


@router.delete("/{rule_id}", status_code=204)
def delete_recurring(rule_id: UUID, db: Session = Depends(get_db)):
    try:
        found = recurring_service.delete_recurring_rule(db, rule_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not found:
        raise HTTPException(status_code=404, detail="Recurring rule not found")
