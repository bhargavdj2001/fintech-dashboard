"""
Dashboard routes.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import DashboardSummaryOut
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryOut)
def get_summary(db: Session = Depends(get_db)):
    try:
        return dashboard_service.get_dashboard_summary(db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
