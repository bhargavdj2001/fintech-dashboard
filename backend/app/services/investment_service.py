"""
Investment service — CRUD operations for investments and investment transactions.
"""
from uuid import UUID, uuid4

from sqlalchemy.orm import Session, joinedload

from app.models import Investment, InvestmentTransaction
from app.schemas import InvestmentIn, InvestmentTransactionIn, InvestmentUpdate


def _with_relations(db: Session, investment_id: UUID):
    return (
        db.query(Investment)
        .options(
            joinedload(Investment.account),
            joinedload(Investment.investment_transactions),
        )
        .filter(Investment.id == investment_id)
        .first()
    )


def get_investments(db: Session, household_id: UUID) -> list:
    return (
        db.query(Investment)
        .options(
            joinedload(Investment.account),
            joinedload(Investment.investment_transactions),
        )
        .filter(Investment.household_id == household_id)
        .order_by(Investment.created_at.desc())
        .all()
    )


def create_investment(
    db: Session, payload: InvestmentIn, household_id: UUID
) -> Investment:
    investment = Investment(
        id=uuid4(),
        household_id=household_id,
        name=payload.name,
        instrument=payload.instrument,
        account_id=payload.account_id,
    )
    db.add(investment)
    db.commit()
    return _with_relations(db, investment.id)


def update_investment(
    db: Session, investment_id: UUID, payload: InvestmentUpdate, household_id: UUID
):
    investment = db.query(Investment).filter(Investment.id == investment_id).first()
    if not investment:
        return None
    if investment.household_id != household_id:
        return None
    data = payload.model_dump(exclude_none=True)
    for key, val in data.items():
        setattr(investment, key, val)
    db.commit()
    return _with_relations(db, investment_id)


def delete_investment(db: Session, investment_id: UUID, household_id: UUID) -> bool:
    investment = db.query(Investment).filter(Investment.id == investment_id).first()
    if not investment:
        return False
    if investment.household_id != household_id:
        return False
    db.delete(investment)
    db.commit()
    return True


def create_investment_transaction(
    db: Session, investment_id: UUID, payload: InvestmentTransactionIn, household_id: UUID
):
    investment = db.query(Investment).filter(Investment.id == investment_id).first()
    if not investment:
        return None
    if investment.household_id != household_id:
        return None
    txn = InvestmentTransaction(
        id=uuid4(),
        investment_id=investment_id,
        txn_type=payload.txn_type,
        units=payload.units,
        price_per_unit=payload.price_per_unit,
        fees=payload.fees,
        currency=payload.currency,
        occurred_at=payload.occurred_at,
    )
    db.add(txn)
    db.commit()
    return _with_relations(db, investment_id)


def delete_investment_transaction(
    db: Session, investment_id: UUID, txn_id: UUID, household_id: UUID
):
    investment = db.query(Investment).filter(Investment.id == investment_id).first()
    if not investment or investment.household_id != household_id:
        return None
    txn = (
        db.query(InvestmentTransaction)
        .filter(
            InvestmentTransaction.id == txn_id,
            InvestmentTransaction.investment_id == investment_id,
        )
        .first()
    )
    if not txn:
        return None
    db.delete(txn)
    db.commit()
    return _with_relations(db, investment_id)
