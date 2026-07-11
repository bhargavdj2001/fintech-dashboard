"""
Dashboard routes.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_household_id
from app.schemas import DashboardSummaryOut
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryOut)
def get_summary(
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        return dashboard_service.get_dashboard_summary(db, household_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
