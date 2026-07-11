"""
Seed the database with realistic sample data for local development / demos.

Usage (run from backend/):
    python -m scripts.seed            # skip if a seeded household already exists
    python -m scripts.seed --reset    # wipe everything this script owns and reseed
"""
import argparse
import datetime as dt
import random
import sys
import uuid

sys.path.insert(0, ".")

from app.database import SessionLocal  # noqa: E402
from app.models import (  # noqa: E402
    Account,
    Budget,
    Category,
    Goal,
    Household,
    Investment,
    InvestmentTransaction,
    Profile,
    RecurringRule,
    Settlement,
    Transaction,
    TransactionSplit,
    UserSettings,
)

HOUSEHOLD_NAME = "Bhargav & Partner Household"
RNG = random.Random(42)

CATEGORIES = [
    ("Groceries", False),
    ("Rent", False),
    ("Utilities", False),
    ("Dining Out", False),
    ("Transport", False),
    ("Entertainment", False),
    ("Healthcare", False),
    ("Shopping", False),
    ("Travel", False),
    ("Subscriptions", False),
    ("Salary", True),
    ("Freelance", True),
]

MERCHANTS_BY_CATEGORY = {
    "Groceries": ["Whole Foods", "Trader Joe's", "Costco"],
    "Rent": ["Property Management Co."],
    "Utilities": ["City Power & Water", "Comcast Internet"],
    "Dining Out": ["Chipotle", "Local Bistro", "Starbucks"],
    "Transport": ["Uber", "Shell Gas Station", "Metro Transit"],
    "Entertainment": ["AMC Theatres", "Steam", "Spotify"],
    "Healthcare": ["CVS Pharmacy", "City Clinic"],
    "Shopping": ["Amazon", "Target", "Best Buy"],
    "Travel": ["Delta Airlines", "Airbnb", "Marriott"],
    "Subscriptions": ["Netflix", "Spotify", "iCloud Storage"],
}


def _wipe_owned(db):
    household = db.query(Household).filter(Household.name == HOUSEHOLD_NAME).first()
    if not household:
        return
    hid = household.id
    db.query(Settlement).filter(Settlement.household_id == hid).delete()
    db.query(Goal).filter(Goal.household_id == hid).delete()
    db.query(UserSettings).filter(UserSettings.household_id == hid).delete()
    db.query(RecurringRule).filter(RecurringRule.household_id == hid).delete()
    investment_ids = [i.id for i in db.query(Investment).filter(Investment.household_id == hid).all()]
    if investment_ids:
        db.query(InvestmentTransaction).filter(
            InvestmentTransaction.investment_id.in_(investment_ids)
        ).delete(synchronize_session=False)
        db.query(Investment).filter(Investment.household_id == hid).delete()
    db.query(Budget).filter(Budget.household_id == hid).delete()
    transaction_ids = [t.id for t in db.query(Transaction).filter(Transaction.household_id == hid).all()]
    if transaction_ids:
        db.query(TransactionSplit).filter(
            TransactionSplit.transaction_id.in_(transaction_ids)
        ).delete(synchronize_session=False)
        db.query(Transaction).filter(Transaction.household_id == hid).delete()
    db.query(Account).filter(Account.household_id == hid).delete()
    db.query(Category).filter(Category.household_id == hid).delete()
    db.query(Profile).filter(Profile.household_id == hid).delete()
    db.query(Household).filter(Household.id == hid).delete()
    db.commit()
    print(f"Wiped existing seeded household {hid}")


def seed(reset: bool):
    db = SessionLocal()
    try:
        existing = db.query(Household).filter(Household.name == HOUSEHOLD_NAME).first()
        if existing and not reset:
            print(f"Household '{HOUSEHOLD_NAME}' already exists ({existing.id}); skipping. Use --reset to reseed.")
            return
        if existing and reset:
            _wipe_owned(db)

        household = Household(id=uuid.uuid4(), name=HOUSEHOLD_NAME)
        db.add(household)
        db.commit()

        bhargav = Profile(id=uuid.uuid4(), household_id=household.id, name="Bhargav", default_share=0.5)
        partner = Profile(id=uuid.uuid4(), household_id=household.id, name="Partner", default_share=0.5)
        db.add_all([bhargav, partner])
        db.commit()

        categories = {}
        for name, is_income in CATEGORIES:
            cat = Category(id=uuid.uuid4(), household_id=household.id, name=name, is_income=is_income)
            db.add(cat)
            categories[name] = cat
        db.commit()

        checking = Account(id=uuid.uuid4(), household_id=household.id, name="Main Checking", type="checking", opening_balance=4250.0)
        savings = Account(id=uuid.uuid4(), household_id=household.id, name="Savings", type="savings", opening_balance=18500.0)
        credit = Account(id=uuid.uuid4(), household_id=household.id, name="Rewards Credit Card", type="credit", opening_balance=-1240.50)
        cash = Account(id=uuid.uuid4(), household_id=household.id, name="Cash Wallet", type="cash", opening_balance=120.0)
        brokerage = Account(id=uuid.uuid4(), household_id=household.id, name="Brokerage", type="investment", opening_balance=15600.0)
        accounts = [checking, savings, credit, cash, brokerage]
        db.add_all(accounts)
        db.commit()

        # ---- Transactions: ~75 days of history -----------------------------
        today = dt.date.today()
        start_date = today - dt.timedelta(days=75)
        expense_categories = [c for c in categories.values() if not c.is_income]
        income_categories = [c for c in categories.values() if c.is_income]
        spendable_accounts = [checking, credit, cash]

        transactions = []
        cur = start_date
        while cur <= today:
            # Salary on the 1st and 15th
            if cur.day in (1, 15):
                txn = Transaction(
                    id=uuid.uuid4(),
                    household_id=household.id,
                    account_id=checking.id,
                    title="Salary deposit",
                    merchant="Acme Corp Payroll",
                    amount=3200.0,
                    type="income",
                    category_id=categories["Salary"].id,
                    occurred_at=dt.datetime.combine(cur, dt.time(9, 0), tzinfo=dt.timezone.utc),
                    status="cleared",
                    created_by_profile_id=bhargav.id,
                )
                transactions.append(txn)

            # 0-3 expenses per day
            for _ in range(RNG.randint(0, 2)):
                cat = RNG.choice(expense_categories)
                merchant = RNG.choice(MERCHANTS_BY_CATEGORY.get(cat.name, ["Generic Merchant"]))
                amount = round(RNG.uniform(8, 220), 2)
                account = RNG.choice(spendable_accounts)
                txn = Transaction(
                    id=uuid.uuid4(),
                    household_id=household.id,
                    account_id=account.id,
                    title=f"{merchant} purchase",
                    merchant=merchant,
                    amount=amount,
                    type="expense",
                    category_id=cat.id,
                    occurred_at=dt.datetime.combine(cur, dt.time(RNG.randint(7, 21), RNG.randint(0, 59)), tzinfo=dt.timezone.utc),
                    status="cleared",
                    created_by_profile_id=RNG.choice([bhargav.id, partner.id]),
                )
                transactions.append(txn)
            cur += dt.timedelta(days=1)

        # Freelance income twice
        for offset in (10, 40):
            txn = Transaction(
                id=uuid.uuid4(),
                household_id=household.id,
                account_id=checking.id,
                title="Freelance project payment",
                merchant="Client Invoice",
                amount=round(RNG.uniform(400, 1200), 2),
                type="income",
                category_id=categories["Freelance"].id,
                occurred_at=dt.datetime.combine(today - dt.timedelta(days=offset), dt.time(12, 0), tzinfo=dt.timezone.utc),
                status="cleared",
                created_by_profile_id=bhargav.id,
            )
            transactions.append(txn)

        db.add_all(transactions)
        db.commit()

        # Split a handful of dining/groceries transactions between the two profiles
        splittable = [
            t for t in transactions
            if t.category_id in (categories["Dining Out"].id, categories["Groceries"].id)
        ][:12]
        for txn in splittable:
            half = round(float(txn.amount) / 2, 2)
            db.add_all([
                TransactionSplit(id=uuid.uuid4(), transaction_id=txn.id, profile_id=bhargav.id, share_amount=half, share_percent=0.5, paid_amount=float(txn.amount)),
                TransactionSplit(id=uuid.uuid4(), transaction_id=txn.id, profile_id=partner.id, share_amount=half, share_percent=0.5, paid_amount=0),
            ])
        db.commit()

        # ---- Budgets ---------------------------------------------------------
        budgets = [
            Budget(id=uuid.uuid4(), household_id=household.id, name="Groceries Budget", category_id=categories["Groceries"].id, amount=600.0, period_type="monthly"),
            Budget(id=uuid.uuid4(), household_id=household.id, name="Dining Out Budget", category_id=categories["Dining Out"].id, amount=300.0, period_type="monthly"),
            Budget(id=uuid.uuid4(), household_id=household.id, name="Entertainment Budget", category_id=categories["Entertainment"].id, amount=150.0, period_type="monthly"),
            Budget(id=uuid.uuid4(), household_id=household.id, name="Transport Budget", category_id=categories["Transport"].id, amount=200.0, period_type="monthly"),
            Budget(id=uuid.uuid4(), household_id=household.id, name="Shopping Budget", category_id=categories["Shopping"].id, amount=250.0, period_type="monthly"),
        ]
        db.add_all(budgets)
        db.commit()

        # ---- Investments -------------------------------------------------------
        aapl = Investment(id=uuid.uuid4(), household_id=household.id, name="Apple Inc.", instrument="stock", account_id=brokerage.id)
        voo = Investment(id=uuid.uuid4(), household_id=household.id, name="Vanguard S&P 500 ETF", instrument="etf", account_id=brokerage.id)
        btc = Investment(id=uuid.uuid4(), household_id=household.id, name="Bitcoin", instrument="crypto", account_id=brokerage.id)
        db.add_all([aapl, voo, btc])
        db.commit()

        investment_txns = [
            InvestmentTransaction(id=uuid.uuid4(), investment_id=aapl.id, txn_type="buy", units=20, price_per_unit=150.0, occurred_at=dt.datetime.combine(today - dt.timedelta(days=70), dt.time(10, 0), tzinfo=dt.timezone.utc)),
            InvestmentTransaction(id=uuid.uuid4(), investment_id=aapl.id, txn_type="dividend", units=None, price_per_unit=None, fees=None, currency="USD", occurred_at=dt.datetime.combine(today - dt.timedelta(days=30), dt.time(10, 0), tzinfo=dt.timezone.utc)),
            InvestmentTransaction(id=uuid.uuid4(), investment_id=voo.id, txn_type="buy", units=15, price_per_unit=410.0, occurred_at=dt.datetime.combine(today - dt.timedelta(days=60), dt.time(10, 0), tzinfo=dt.timezone.utc)),
            InvestmentTransaction(id=uuid.uuid4(), investment_id=voo.id, txn_type="buy", units=5, price_per_unit=430.0, occurred_at=dt.datetime.combine(today - dt.timedelta(days=20), dt.time(10, 0), tzinfo=dt.timezone.utc)),
            InvestmentTransaction(id=uuid.uuid4(), investment_id=btc.id, txn_type="buy", units=0.05, price_per_unit=62000.0, occurred_at=dt.datetime.combine(today - dt.timedelta(days=45), dt.time(10, 0), tzinfo=dt.timezone.utc)),
        ]
        db.add_all(investment_txns)
        db.commit()

        # ---- Recurring rules -----------------------------------------------
        recurring = [
            RecurringRule(id=uuid.uuid4(), household_id=household.id, freq="monthly", is_active=True, next_run_at=dt.datetime.combine(today.replace(day=1) + dt.timedelta(days=32), dt.time(9, 0), tzinfo=dt.timezone.utc), template_txn={"title": "Rent", "amount": 1800.0, "type": "expense", "account_id": str(checking.id), "category_id": str(categories["Rent"].id)}),
            RecurringRule(id=uuid.uuid4(), household_id=household.id, freq="monthly", is_active=True, next_run_at=dt.datetime.combine(today.replace(day=1) + dt.timedelta(days=32), dt.time(9, 0), tzinfo=dt.timezone.utc), template_txn={"title": "Salary deposit", "amount": 3200.0, "type": "income", "account_id": str(checking.id), "category_id": str(categories["Salary"].id)}),
            RecurringRule(id=uuid.uuid4(), household_id=household.id, freq="monthly", is_active=True, next_run_at=dt.datetime.combine(today.replace(day=1) + dt.timedelta(days=32), dt.time(9, 0), tzinfo=dt.timezone.utc), template_txn={"title": "Netflix subscription", "amount": 15.49, "type": "expense", "account_id": str(credit.id), "category_id": str(categories["Subscriptions"].id)}),
        ]
        db.add_all(recurring)
        db.commit()

        # ---- Goals ------------------------------------------------------------
        goals = [
            Goal(id=uuid.uuid4(), household_id=household.id, name="Emergency Fund", category="Savings", target_amount=15000.0, current_amount=8500.0, monthly_contribution=500.0, target_date=today + dt.timedelta(days=365), status="on-track"),
            Goal(id=uuid.uuid4(), household_id=household.id, name="Vacation to Japan", category="Travel", target_amount=6000.0, current_amount=1800.0, monthly_contribution=300.0, target_date=today + dt.timedelta(days=270), status="on-track"),
            Goal(id=uuid.uuid4(), household_id=household.id, name="House Down Payment", category="Home", target_amount=60000.0, current_amount=12000.0, monthly_contribution=800.0, target_date=today + dt.timedelta(days=900), status="behind"),
        ]
        db.add_all(goals)
        db.commit()

        # ---- Settings -----------------------------------------------------
        db.add(UserSettings(
            id=uuid.uuid4(),
            household_id=household.id,
            notifications={
                "budgetAlerts": True,
                "transactionAlerts": True,
                "weeklyReport": True,
                "monthlyReport": True,
                "goalMilestones": True,
                "unusualActivity": True,
                "emailNotifications": True,
                "pushNotifications": False,
            },
        ))
        db.commit()

        # ---- Settlements ----------------------------------------------------
        db.add(Settlement(
            id=uuid.uuid4(),
            household_id=household.id,
            from_profile_id=partner.id,
            to_profile_id=bhargav.id,
            amount=85.0,
            method="venmo",
            note="Settling up groceries",
            occurred_at=dt.datetime.combine(today - dt.timedelta(days=14), dt.time(18, 0), tzinfo=dt.timezone.utc),
        ))
        db.commit()

        print(f"Seeded household {household.id} with {len(transactions)} transactions.")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="Wipe existing seeded data and reseed")
    args = parser.parse_args()
    seed(reset=args.reset)
