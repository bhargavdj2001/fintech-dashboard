"""
Account service — CRUD operations for accounts, plus computing each
account's *current* balance live from real transaction history.

Account.opening_balance is the only stored balance field — it's the balance
as of when the account was added to the app. Everything since then is
derived from Transaction (cash/credit/checking/savings accounts) or
InvestmentTransaction (investment accounts), never stored.
"""
from typing import Dict, List
from uuid import UUID, uuid4

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.models import Account, Investment, InvestmentTransaction, Transaction
from app.schemas import AccountIn


def _compute_cash_deltas(db: Session, account_ids: List[UUID]) -> Dict[UUID, float]:
    """
    Net change since opening_balance for non-investment accounts: income adds,
    expense subtracts, transfer rows are already signed (negative = outflow,
    positive = inflow) per the transfer convention in transaction_service.py.
    """
    if not account_ids:
        return {}
    rows = (
        db.query(
            Transaction.account_id,
            func.coalesce(
                func.sum(
                    case(
                        (Transaction.type == "income", Transaction.amount),
                        (Transaction.type == "expense", -Transaction.amount),
                        (Transaction.type == "transfer", Transaction.amount),
                        else_=0,
                    )
                ),
                0,
            ),
        )
        .filter(Transaction.account_id.in_(account_ids))
        .group_by(Transaction.account_id)
        .all()
    )
    return {acc_id: float(total) for acc_id, total in rows}


def _compute_investment_deltas(db: Session, account_ids: List[UUID]) -> Dict[UUID, float]:
    """
    Net cost basis since opening_balance for investment accounts: buys add
    (units * price + fees paid out), sells subtract (units * price, net of
    fees received). Dividends don't change cost basis — they're cash income,
    not a change in position size — so they contribute 0 here by design.
    This is cost basis, not live market value (that needs a price feed).
    """
    if not account_ids:
        return {}
    rows = (
        db.query(
            Investment.account_id,
            func.coalesce(
                func.sum(
                    case(
                        (
                            InvestmentTransaction.txn_type == "buy",
                            InvestmentTransaction.units * InvestmentTransaction.price_per_unit
                            + func.coalesce(InvestmentTransaction.fees, 0),
                        ),
                        (
                            InvestmentTransaction.txn_type == "sell",
                            -(InvestmentTransaction.units * InvestmentTransaction.price_per_unit)
                            + func.coalesce(InvestmentTransaction.fees, 0),
                        ),
                        else_=0,
                    )
                ),
                0,
            ),
        )
        .join(InvestmentTransaction, InvestmentTransaction.investment_id == Investment.id)
        .filter(Investment.account_id.in_(account_ids))
        .group_by(Investment.account_id)
        .all()
    )
    return {acc_id: float(total) for acc_id, total in rows}


def attach_current_balances(db: Session, accounts: List[Account]) -> List[Account]:
    """Mutates each account in-place, setting a non-persisted .current_balance attribute."""
    if not accounts:
        return accounts
    cash_ids = [a.id for a in accounts if a.type != "investment"]
    inv_ids = [a.id for a in accounts if a.type == "investment"]
    cash_deltas = _compute_cash_deltas(db, cash_ids)
    inv_deltas = _compute_investment_deltas(db, inv_ids)
    for a in accounts:
        delta = inv_deltas.get(a.id, 0.0) if a.type == "investment" else cash_deltas.get(a.id, 0.0)
        a.current_balance = float(a.opening_balance) + delta
    return accounts


def get_current_balance(db: Session, account: Account) -> float:
    return attach_current_balances(db, [account])[0].current_balance


def get_accounts(db: Session, household_id: UUID) -> list:
    accounts = db.query(Account).filter(Account.household_id == household_id).order_by(Account.name).all()
    return attach_current_balances(db, accounts)


def create_account(db: Session, payload: AccountIn) -> Account:
    account = Account(
        id=uuid4(),
        household_id=payload.household_id,
        name=payload.name,
        type=payload.type,
        currency=payload.currency,
        opening_balance=payload.opening_balance,
        external_id=payload.external_id,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    account.current_balance = float(account.opening_balance)
    return account


def set_current_balance(db: Session, account: Account, desired_current_balance: float) -> Account:
    """
    Back-solve opening_balance so current_balance becomes exactly the
    requested value — used by the manual "update balance" endpoint (e.g.
    Cash accounts), which lets the user type the number they want to see
    without needing to think about opening_balance vs. transaction history.
    """
    existing_delta = get_current_balance(db, account) - float(account.opening_balance)
    account.opening_balance = desired_current_balance - existing_delta
    db.commit()
    db.refresh(account)
    account.current_balance = desired_current_balance
    return account


class AccountInUseError(Exception):
    """Raised when an account can't be deleted because other rows reference it."""


def delete_account(db: Session, account_id: UUID) -> bool:
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        return False
    if db.query(Transaction).filter(Transaction.account_id == account_id).first():
        raise AccountInUseError("Account has transactions and cannot be deleted")
    if db.query(Investment).filter(Investment.account_id == account_id).first():
        raise AccountInUseError("Account is linked to an investment and cannot be deleted")
    db.delete(account)
    db.commit()
    return True
