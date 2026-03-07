"""
Routes — /households
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Household
from app.schemas import HouseholdOut

router = APIRouter(prefix="/households", tags=["Households"])


@router.get("", response_model=List[HouseholdOut])
def list_households(db: Session = Depends(get_db)):
    """Return all households. Frontend uses the first one to get household_id."""
    try:
        return db.query(Household).order_by(Household.created_at.asc()).all()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
