"""
Routes — /insights

Rule-based observations computed from real transaction/budget/goal/
recurring-rule data. Not an LLM call — deterministic checks only.
"""
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_household_id
from app.schemas import InsightOut
from app.services import insights_service

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("", response_model=List[InsightOut])
def list_insights(
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        return insights_service.get_insights(db, household_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/alerts")
def list_alerts(
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    """Budget overruns and goal milestones for the notification bell."""
    try:
        return insights_service.get_alerts(db, household_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
