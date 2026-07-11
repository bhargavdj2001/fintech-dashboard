"""
Routes — /analytics
"""
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_household_id
from app.schemas import PartnerBalanceOut, SplitSummaryOut
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/splits", response_model=SplitSummaryOut)
def split_summary(
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    """
    Return aggregated split-expense ownership between profiles.

    - your_share / partner_share — portion each person owes regardless of who paid
    - you_paid / partner_paid    — actual upfront payments
    - net_balance                — you_paid minus your_share (positive = partner owes you)
    """
    try:
        return analytics_service.get_split_summary(db, household_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/balances", response_model=List[PartnerBalanceOut])
def balances_by_partner(
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    """
    Return your net balance with each other household member individually —
    not a full N-way settlement matrix, just "where do you and this person
    stand" for every person you've shared an expense with.
    """
    try:
        return analytics_service.get_balances_by_partner(db, household_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
