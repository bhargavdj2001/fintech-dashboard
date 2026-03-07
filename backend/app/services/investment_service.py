"""
Investment service — read operations for investments.
"""
from sqlalchemy.orm import Session, joinedload

from app.models import Investment, InvestmentTransaction


def get_investments(db: Session) -> list:
    return (
        db.query(Investment)
        .options(
            joinedload(Investment.account),
            joinedload(Investment.investment_transactions),
        )
        .order_by(Investment.created_at.desc())
        .all()
    )
