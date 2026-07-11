"""
Shared FastAPI dependencies.
Re-exports get_db so routes only need to import from one place, and
provides get_current_user_id / get_current_household_id for routes that
need the authenticated user's identity (the auth middleware in main.py
already gates access at the request level — these dependencies surface
what it found and resolve the user→household mapping).
"""
import uuid

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db  # noqa: F401 — re-exported


def get_current_user_id(request: Request) -> uuid.UUID:
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id


def get_current_household_id(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> uuid.UUID:
    from app.models import Household
    household = db.query(Household).filter(Household.owner_user_id == user_id).first()
    if not household:
        raise HTTPException(
            status_code=404,
            detail="No household found for this user. Please contact support.",
        )
    return household.id
