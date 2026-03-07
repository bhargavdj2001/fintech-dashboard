"""
Analytics service — aggregate queries used by the /analytics endpoints.
"""
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Profile, TransactionSplit
from app.utils import safe_decimal


# Names used to identify "you" vs "partner" in the profiles table.
YOUR_PROFILE_NAME = "Bhargav"
PARTNER_PROFILE_NAME = "Partner"


def get_split_summary(db: Session) -> dict:
    """
    Return aggregated split-expense ownership metrics.

    Uses SUM(...) FILTER (WHERE ...) — the PostgreSQL aggregate filter
    clause, expressed via SQLAlchemy's func.sum(...).filter(...) API.

    Equivalent SQL:
        SELECT
          SUM(ts.share_amount) FILTER (WHERE p.name = 'Bhargav')  AS your_share,
          SUM(ts.share_amount) FILTER (WHERE p.name = 'Partner')  AS partner_share,
          SUM(ts.paid_amount)  FILTER (WHERE p.name = 'Bhargav')  AS you_paid,
          SUM(ts.paid_amount)  FILTER (WHERE p.name = 'Partner')  AS partner_paid
        FROM transaction_splits ts
        JOIN profiles p ON p.id = ts.profile_id;
    """
    row = (
        db.query(
            func.coalesce(
                func.sum(TransactionSplit.share_amount).filter(
                    Profile.name == YOUR_PROFILE_NAME
                ),
                0,
            ).label("your_share"),
            func.coalesce(
                func.sum(TransactionSplit.share_amount).filter(
                    Profile.name == PARTNER_PROFILE_NAME
                ),
                0,
            ).label("partner_share"),
            func.coalesce(
                func.sum(TransactionSplit.paid_amount).filter(
                    Profile.name == YOUR_PROFILE_NAME
                ),
                0,
            ).label("you_paid"),
            func.coalesce(
                func.sum(TransactionSplit.paid_amount).filter(
                    Profile.name == PARTNER_PROFILE_NAME
                ),
                0,
            ).label("partner_paid"),
        )
        .select_from(TransactionSplit)
        .join(Profile, Profile.id == TransactionSplit.profile_id)
        .one()
    )

    your_share = float(safe_decimal(row.your_share))
    partner_share = float(safe_decimal(row.partner_share))
    you_paid = float(safe_decimal(row.you_paid))
    partner_paid = float(safe_decimal(row.partner_paid))

    return {
        "your_share": your_share,
        "partner_share": partner_share,
        "you_paid": you_paid,
        "partner_paid": partner_paid,
        "net_balance": you_paid - your_share,   # positive → partner owes you
    }
