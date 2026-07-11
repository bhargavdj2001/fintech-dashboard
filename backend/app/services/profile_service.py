"""
Profile service — CRUD operations for household members.
"""
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models import Profile, Settlement, TransactionSplit
from app.schemas import ProfileIn, ProfileUpdate


class ProfileInUseError(Exception):
    """Raised when a profile can't be deleted because financial records reference it."""


class CannotDeleteOwnerError(Exception):
    """Raised when attempting to delete the household's owner profile."""


def get_profiles(db: Session, household_id: UUID) -> list:
    return (
        db.query(Profile)
        .filter(Profile.household_id == household_id)
        .order_by(Profile.name)
        .all()
    )


def _clear_other_owners(db: Session, household_id: UUID, exclude_id: UUID | None = None) -> None:
    q = db.query(Profile).filter(Profile.household_id == household_id, Profile.is_owner.is_(True))
    if exclude_id is not None:
        q = q.filter(Profile.id != exclude_id)
    q.update({"is_owner": False})


def create_profile(db: Session, payload: ProfileIn, household_id: UUID) -> Profile:
    profile = Profile(
        id=uuid4(),
        household_id=household_id,
        name=payload.name,
        email=payload.email,
        avatar_url=payload.avatar_url,
        default_share=payload.default_share,
        is_owner=payload.is_owner,
    )
    if payload.is_owner:
        _clear_other_owners(db, household_id)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def update_profile(db: Session, profile_id: UUID, payload: ProfileUpdate, household_id: UUID):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        return None
    if profile.household_id != household_id:
        return None
    data = payload.model_dump(exclude_none=True)
    if data.get("is_owner") is True:
        _clear_other_owners(db, profile.household_id, exclude_id=profile_id)
    for key, val in data.items():
        setattr(profile, key, val)
    db.commit()
    db.refresh(profile)
    return profile


def delete_profile(db: Session, profile_id: UUID, household_id: UUID) -> bool:
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        return False
    if profile.household_id != household_id:
        return False
    if profile.is_owner:
        raise CannotDeleteOwnerError(
            "Cannot delete the owner profile — assign ownership to another profile first"
        )
    if db.query(TransactionSplit).filter(TransactionSplit.profile_id == profile_id).first():
        raise ProfileInUseError("Profile has transaction splits and cannot be deleted")
    if (
        db.query(Settlement)
        .filter(
            (Settlement.from_profile_id == profile_id) | (Settlement.to_profile_id == profile_id)
        )
        .first()
    ):
        raise ProfileInUseError("Profile has settlements and cannot be deleted")
    db.delete(profile)
    db.commit()
    return True
