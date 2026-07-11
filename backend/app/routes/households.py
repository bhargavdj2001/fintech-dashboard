"""
Routes — /households
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user_id
from app.models import Household
from app.schemas import HouseholdOut

router = APIRouter(prefix="/households", tags=["Households"])


@router.get("", response_model=HouseholdOut)
def get_my_household(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Return the household belonging to the authenticated user."""
    h = db.query(Household).filter(Household.owner_user_id == user_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="No household found for this user")
    return h
