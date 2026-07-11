"""
Routes — /profiles
"""
import uuid
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_household_id
from app.schemas import ProfileIn, ProfileOut, ProfileUpdate
from app.services import profile_service
from app.services.profile_service import CannotDeleteOwnerError, ProfileInUseError

router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.get("", response_model=List[ProfileOut])
def list_profiles(
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    """Return all profiles. Used for split/settle-up pickers in Shared Expenses."""
    try:
        return profile_service.get_profiles(db, household_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("", response_model=ProfileOut, status_code=201)
def create_profile(
    payload: ProfileIn,
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        return profile_service.create_profile(db, payload, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/{profile_id}", response_model=ProfileOut)
def update_profile(
    profile_id: UUID,
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        profile = profile_service.update_profile(db, profile_id, payload, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.delete("/{profile_id}", status_code=204)
def delete_profile(
    profile_id: UUID,
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        found = profile_service.delete_profile(db, profile_id, household_id)
    except (ProfileInUseError, CannotDeleteOwnerError) as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not found:
        raise HTTPException(status_code=404, detail="Profile not found")
