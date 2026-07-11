"""
Scheduler concurrency safety.

If this app is ever deployed with multiple worker processes, each worker
starts its own BackgroundScheduler, and without coordination every job would
fire once per worker. Postgres advisory locks make each job a no-op on every
worker except whichever one grabs the lock first — pure SQL, no new
dependency, no separate lock service.
"""
from contextlib import contextmanager

from sqlalchemy import text
from sqlalchemy.orm import Session


@contextmanager
def advisory_lock(db: Session, key: int):
    """
    Yields True if the lock was acquired (caller should do the work), False
    if another process already holds it (caller should skip this run).
    """
    acquired = bool(db.execute(text("select pg_try_advisory_lock(:key)"), {"key": key}).scalar())
    try:
        yield acquired
    finally:
        if acquired:
            db.execute(text("select pg_advisory_unlock(:key)"), {"key": key})
