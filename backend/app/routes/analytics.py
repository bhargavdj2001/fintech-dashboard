"""
Routes — /analytics
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas import SplitSummaryOut
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/splits", response_model=SplitSummaryOut)
def split_summary(db: Session = Depends(get_db)):
    """
    Return aggregated split-expense ownership between profiles.

    - your_share / partner_share — portion each person owes regardless of who paid
    - you_paid / partner_paid    — actual upfront payments
    - net_balance                — you_paid minus your_share (positive = partner owes you)
    """
    try:
        return analytics_service.get_split_summary(db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
