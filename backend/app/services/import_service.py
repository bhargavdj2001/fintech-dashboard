"""
CSV transaction import — parses with Python's built-in csv module, no
external dependency. Expected columns: date, title, amount, type
(income|expense|transfer), and optionally account, category.
"""
import csv
import datetime as dt
import io
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models import Account, Category, Transaction

REQUIRED_COLUMNS = {"date", "title", "amount", "type"}
_VALID_TYPES = {"income", "expense", "transfer"}


def import_transactions_csv(db: Session, household_id: UUID, contents: bytes) -> dict:
    text = contents.decode("utf-8-sig")  # utf-8-sig strips a BOM if present (common from Excel exports)
    reader = csv.DictReader(io.StringIO(text))

    if not reader.fieldnames or not REQUIRED_COLUMNS.issubset({f.strip().lower() for f in reader.fieldnames}):
        return {
            "created": 0,
            "skipped": 0,
            "errors": [{"row": 0, "reason": f"CSV must have columns: {', '.join(sorted(REQUIRED_COLUMNS))}"}],
        }

    accounts_by_name = {
        a.name.strip().lower(): a
        for a in db.query(Account).filter(Account.household_id == household_id).all()
    }
    categories_by_name = {c.name.strip().lower(): c for c in db.query(Category).all()}
    single_account = list(accounts_by_name.values())[0] if len(accounts_by_name) == 1 else None

    created = 0
    errors = []
    for i, raw_row in enumerate(reader, start=2):  # row 1 is the header
        row = {(k or "").strip().lower(): (v or "").strip() for k, v in raw_row.items()}
        date_str = row.get("date", "")
        title = row.get("title", "")
        amount_str = row.get("amount", "")
        type_str = row.get("type", "").lower()

        if not date_str or not title or not amount_str or not type_str:
            errors.append({"row": i, "reason": "Missing a required field (date/title/amount/type)"})
            continue
        if type_str not in _VALID_TYPES:
            errors.append({"row": i, "reason": f"Invalid type '{type_str}' — must be income, expense, or transfer"})
            continue
        try:
            amount = float(amount_str)
        except ValueError:
            errors.append({"row": i, "reason": f"Invalid amount '{amount_str}'"})
            continue
        if amount <= 0:
            errors.append({"row": i, "reason": "Amount must be greater than zero"})
            continue
        try:
            occurred_at = dt.datetime.fromisoformat(date_str)
            if occurred_at.tzinfo is None:
                occurred_at = occurred_at.replace(tzinfo=dt.timezone.utc)
        except ValueError:
            errors.append({"row": i, "reason": f"Invalid date '{date_str}' — use YYYY-MM-DD"})
            continue

        account_name = row.get("account", "").lower()
        account = accounts_by_name.get(account_name) if account_name else single_account
        if not account:
            reason = (
                f"Account '{row.get('account', '')}' not found"
                if account_name
                else "No account specified, and you have more than one account"
            )
            errors.append({"row": i, "reason": reason})
            continue

        category = categories_by_name.get(row.get("category", "").lower())

        db.add(Transaction(
            id=uuid4(),
            household_id=household_id,
            account_id=account.id,
            title=title,
            amount=amount,
            type=type_str,
            category_id=category.id if category else None,
            occurred_at=occurred_at,
            status="cleared",
            imported_from="csv",
        ))
        created += 1

    db.commit()
    return {"created": created, "skipped": len(errors), "errors": errors}
