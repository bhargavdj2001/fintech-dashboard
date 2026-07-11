"""
Settlement service — CRUD operations for settle-up records between profiles.
"""
from uuid import UUID, uuid4

from sqlalchemy.orm import Session, joinedload

from app.models import Settlement
from app.schemas import SettlementIn


def get_settlements(db: Session, household_id: UUID) -> list:
    return (
        db.query(Settlement)
        .options(joinedload(Settlement.from_profile), joinedload(Settlement.to_profile))
        .filter(Settlement.household_id == household_id)
        .order_by(Settlement.created_at.desc())
        .all()
    )


def create_settlement(db: Session, payload: SettlementIn, household_id: UUID) -> Settlement:
    settlement = Settlement(
        id=uuid4(),
        household_id=household_id,
        from_profile_id=payload.from_profile_id,
        to_profile_id=payload.to_profile_id,
        amount=payload.amount,
        method=payload.method,
        note=payload.note,
        occurred_at=payload.occurred_at,
    )
    db.add(settlement)
    db.commit()
    return (
        db.query(Settlement)
        .options(joinedload(Settlement.from_profile), joinedload(Settlement.to_profile))
        .filter(Settlement.id == settlement.id)
        .first()
    )


def delete_settlement(db: Session, settlement_id: UUID, household_id: UUID) -> bool:
    settlement = db.query(Settlement).filter(Settlement.id == settlement_id).first()
    if not settlement:
        return False
    if settlement.household_id != household_id:
        return False
    db.delete(settlement)
    db.commit()
    return True
