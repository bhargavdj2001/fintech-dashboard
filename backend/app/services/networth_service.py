"""
Net worth service — daily snapshot job + report query for the Reports
"Net Worth" tab.
"""
import datetime as dt
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models import Account, Household, NetWorthSnapshot
from app.services.account_service import attach_current_balances


def _compute_current_breakdown(db: Session, household_id: UUID) -> dict:
    accounts = attach_current_balances(
        db, db.query(Account).filter(Account.household_id == household_id).all()
    )
    total_assets = sum(a.current_balance for a in accounts if a.type != "credit")
    total_liabilities = sum(abs(a.current_balance) for a in accounts if a.type == "credit")
    return {
        "total_assets": total_assets,
        "total_liabilities": total_liabilities,
        "net_worth": total_assets - total_liabilities,
    }


def take_daily_snapshot(db: Session) -> int:
    """Upsert today's net worth snapshot for every household. Returns the count written."""
    households = db.query(Household).all()
    today = dt.date.today()
    count = 0
    for h in households:
        breakdown = _compute_current_breakdown(db, h.id)
        existing = (
            db.query(NetWorthSnapshot)
            .filter(NetWorthSnapshot.household_id == h.id, NetWorthSnapshot.snapshot_date == today)
            .first()
        )
        if existing:
            existing.total_assets = breakdown["total_assets"]
            existing.total_liabilities = breakdown["total_liabilities"]
            existing.net_worth = breakdown["net_worth"]
        else:
            db.add(
                NetWorthSnapshot(
                    id=uuid4(),
                    household_id=h.id,
                    snapshot_date=today,
                    **breakdown,
                )
            )
        count += 1
    db.commit()
    return count


def get_networth_report(db: Session, household_id: UUID) -> dict:
    history = (
        db.query(NetWorthSnapshot)
        .filter(NetWorthSnapshot.household_id == household_id)
        .order_by(NetWorthSnapshot.snapshot_date.asc())
        .all()
    )
    current = _compute_current_breakdown(db, household_id)
    return {
        "history": history,
        "current_total_assets": current["total_assets"],
        "current_total_liabilities": current["total_liabilities"],
        "current_net_worth": current["net_worth"],
    }
