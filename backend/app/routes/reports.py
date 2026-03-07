"""
Routes — /reports
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas import PeriodReportOut
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/period", response_model=PeriodReportOut)
def period_report(
    start_date: Optional[datetime] = Query(None, description="Period start (ISO 8601)"),
    end_date: Optional[datetime] = Query(None, description="Period end (ISO 8601)"),
    db: Session = Depends(get_db),
):
    """
    Return a financial summary for a date range.

    Includes total income, total expense, net cashflow, per-category breakdown,
    and the full transaction list for the period.
    """
    try:
        return report_service.get_period_report(db, start_date=start_date, end_date=end_date)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
