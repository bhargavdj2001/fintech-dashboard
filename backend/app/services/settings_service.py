"""
Settings service — get-or-create singleton settings row per household.
"""
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models import UserSettings
from app.schemas import SettingsUpdate


def get_or_create_settings(db: Session, household_id: UUID) -> UserSettings:
    settings = db.query(UserSettings).filter(UserSettings.household_id == household_id).first()
    if not settings:
        settings = UserSettings(id=uuid4(), household_id=household_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def update_settings(db: Session, payload: SettingsUpdate, household_id: UUID) -> UserSettings:
    settings = get_or_create_settings(db, household_id)
    data = payload.model_dump(exclude_none=True)
    for key, val in data.items():
        setattr(settings, key, val)
    db.commit()
    db.refresh(settings)
    return settings
