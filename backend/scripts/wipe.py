"""
Wipe all demo/seed financial data so the user can enter everything themselves.

Keeps the household, profiles, and categories — there's no "create household",
"add profile", or "add category" UI anywhere in the app, so wiping those would
leave dropdowns empty with no way to repopulate them. Everything the UI *can*
create (accounts, transactions, budgets, investments, goals, recurring rules,
settlements) gets wiped. Settings resets to defaults on next read (get-or-create).

Usage (run from backend/):
    python -m scripts.wipe
"""
import sys

sys.path.insert(0, ".")

from app.database import SessionLocal  # noqa: E402
from app.models import (  # noqa: E402
    Account,
    Budget,
    Goal,
    Investment,
    InvestmentTransaction,
    RecurringRule,
    Settlement,
    Transaction,
    TransactionSplit,
    UserSettings,
)


def wipe():
    db = SessionLocal()
    try:
        counts = {}
        for model in [
            TransactionSplit,
            Transaction,
            InvestmentTransaction,
            Investment,
            Budget,
            RecurringRule,
            Settlement,
            Goal,
            UserSettings,
            Account,
        ]:
            counts[model.__tablename__] = db.query(model).delete()
        db.commit()
        for table, count in counts.items():
            print(f"  {table}: {count} rows deleted")
        print("Done. Financial data wiped — household/profiles/categories kept so dropdowns still work.")
    finally:
        db.close()


if __name__ == "__main__":
    wipe()
