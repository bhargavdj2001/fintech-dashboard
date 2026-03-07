"""
Shared utility helpers used across services and routes.
"""
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional


def utcnow() -> datetime:
    """Return the current UTC datetime (timezone-aware)."""
    return datetime.now(tz=timezone.utc)


def safe_decimal(value) -> Decimal:
    """Convert a value to Decimal, returning 0 if None."""
    if value is None:
        return Decimal("0")
    return Decimal(str(value))


def paginate(query, limit: int, offset: int):
    """Apply limit/offset pagination to a SQLAlchemy query."""
    return query.limit(limit).offset(offset)
