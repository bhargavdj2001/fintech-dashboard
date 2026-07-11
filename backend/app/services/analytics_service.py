"""
Analytics service — aggregate queries used by the /analytics endpoints.

"You" vs "partner" used to be hardcoded by profile name. Now it's resolved
at call time from Profile.is_owner — the one profile flagged as the
logged-in user's "self" identity. "Partner" means "every other profile
combined", so this still works cleanly with exactly 2 profiles (the common
case) and degrades sensibly to "you vs everyone else" with 3+.
"""
from typing import Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Profile, Settlement, TransactionSplit
from app.utils import safe_decimal


def _get_owner_profile_id(db: Session, household_id: UUID) -> Optional[UUID]:
    """
    Resolve the household's "self" profile id.

    Defensive handling:
    - No profile flagged is_owner: fall back to the oldest profile, so this
      degrades gracefully rather than crashing.
    - No profiles at all: return None — callers treat this as "no data".
    """
    owner = (
        db.query(Profile)
        .filter(Profile.household_id == household_id, Profile.is_owner.is_(True))
        .order_by(Profile.created_at.asc())
        .first()
    )
    if owner:
        return owner.id
    fallback = (
        db.query(Profile)
        .filter(Profile.household_id == household_id)
        .order_by(Profile.created_at.asc())
        .first()
    )
    return fallback.id if fallback else None


def get_split_summary(db: Session, household_id: UUID) -> dict:
    """Return aggregated split-expense ownership metrics: you vs everyone else."""
    owner_id = _get_owner_profile_id(db, household_id)
    if owner_id is None:
        return {
            "your_share": 0.0,
            "partner_share": 0.0,
            "you_paid": 0.0,
            "partner_paid": 0.0,
            "net_balance": 0.0,
        }

    row = (
        db.query(
            func.coalesce(
                func.sum(TransactionSplit.share_amount).filter(
                    TransactionSplit.profile_id == owner_id
                ),
                0,
            ).label("your_share"),
            func.coalesce(
                func.sum(TransactionSplit.share_amount).filter(
                    TransactionSplit.profile_id != owner_id
                ),
                0,
            ).label("partner_share"),
            func.coalesce(
                func.sum(TransactionSplit.paid_amount).filter(
                    TransactionSplit.profile_id == owner_id
                ),
                0,
            ).label("you_paid"),
            func.coalesce(
                func.sum(TransactionSplit.paid_amount).filter(
                    TransactionSplit.profile_id != owner_id
                ),
                0,
            ).label("partner_paid"),
        )
        .select_from(TransactionSplit)
        .one()
    )

    your_share = float(safe_decimal(row.your_share))
    partner_share = float(safe_decimal(row.partner_share))
    you_paid = float(safe_decimal(row.you_paid))
    partner_paid = float(safe_decimal(row.partner_paid))

    net_balance = you_paid - your_share   # positive → others owe you
    net_balance += _get_settled_delta(db, owner_id, household_id)

    return {
        "your_share": your_share,
        "partner_share": partner_share,
        "you_paid": you_paid,
        "partner_paid": partner_paid,
        "net_balance": net_balance,
    }


def _get_settled_delta(db: Session, owner_id: UUID, household_id: UUID) -> float:
    """
    Net change to `net_balance` from recorded settle-up payments.

    Someone else paying you down (from=other, to=owner) shrinks what they
    owe you, so it subtracts from net_balance. You paying someone else down
    (from=owner, to=other) shrinks what you owe them, so it adds.
    """
    row = (
        db.query(
            func.coalesce(
                func.sum(Settlement.amount).filter(
                    Settlement.from_profile_id != owner_id,
                    Settlement.to_profile_id == owner_id,
                ),
                0,
            ).label("settled_to_you"),
            func.coalesce(
                func.sum(Settlement.amount).filter(
                    Settlement.from_profile_id == owner_id,
                    Settlement.to_profile_id != owner_id,
                ),
                0,
            ).label("settled_by_you"),
        )
        .select_from(Settlement)
        .filter(Settlement.household_id == household_id)
        .one()
    )

    settled_to_you = float(safe_decimal(row.settled_to_you))
    settled_by_you = float(safe_decimal(row.settled_by_you))
    return settled_by_you - settled_to_you


def _get_pairwise_settled_delta(db: Session, owner_id: UUID, other_id: UUID, household_id: UUID) -> float:
    """Same as _get_settled_delta but restricted to settlements between exactly these two profiles."""
    row = (
        db.query(
            func.coalesce(
                func.sum(Settlement.amount).filter(
                    Settlement.from_profile_id == other_id,
                    Settlement.to_profile_id == owner_id,
                ),
                0,
            ).label("settled_to_you"),
            func.coalesce(
                func.sum(Settlement.amount).filter(
                    Settlement.from_profile_id == owner_id,
                    Settlement.to_profile_id == other_id,
                ),
                0,
            ).label("settled_by_you"),
        )
        .select_from(Settlement)
        .filter(Settlement.household_id == household_id)
        .one()
    )
    settled_to_you = float(safe_decimal(row.settled_to_you))
    settled_by_you = float(safe_decimal(row.settled_by_you))
    return settled_by_you - settled_to_you


def get_balances_by_partner(db: Session, household_id: UUID) -> list:
    """
    For every other household member, their net balance specifically
    against you — not a full N-way debt-simplification matrix, just "where
    do you and this person stand" restricted to transactions you both
    participated in, net of settlements between just the two of you.
    """
    owner_id = _get_owner_profile_id(db, household_id)
    if owner_id is None:
        return []

    others = (
        db.query(Profile)
        .filter(Profile.household_id == household_id, Profile.id != owner_id)
        .order_by(Profile.name)
        .all()
    )
    results = []
    for other in others:
        shared_txn_ids = db.query(TransactionSplit.transaction_id).filter(
            TransactionSplit.profile_id == other.id
        ).subquery()

        row = (
            db.query(
                func.coalesce(func.sum(TransactionSplit.share_amount), 0).label("your_share"),
                func.coalesce(func.sum(TransactionSplit.paid_amount), 0).label("you_paid"),
            )
            .filter(
                TransactionSplit.profile_id == owner_id,
                TransactionSplit.transaction_id.in_(shared_txn_ids),
            )
            .one()
        )
        your_share = float(safe_decimal(row.your_share))
        you_paid = float(safe_decimal(row.you_paid))

        if your_share == 0 and you_paid == 0:
            continue  # no shared transactions with this person — nothing to show

        net_balance = you_paid - your_share
        net_balance += _get_pairwise_settled_delta(db, owner_id, other.id, household_id)

        results.append({
            "profile_id": other.id,
            "profile_name": other.name,
            "your_share": your_share,
            "you_paid": you_paid,
            "net_balance": net_balance,
        })
    return results
