"""
Shared FastAPI dependencies.
Currently re-exports get_db so routes only need to import from one place.
"""
from app.database import get_db  # noqa: F401 — re-exported
