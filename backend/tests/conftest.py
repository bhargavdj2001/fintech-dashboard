"""
Pytest configuration and shared fixtures for the FinancialOS API test suite.

Uses httpx.AsyncClient against the live FastAPI app (no test DB — reads from
the real Supabase instance).  Tests are READ-ONLY: no POST that mutates
lasting state.  The one POST /transactions test creates a transaction and is
idempotent enough for CI validation purposes.

Every route requires auth, so this fixture creates a throwaway test user +
session directly in the DB (bypassing the "registration closed after first
user" rule), attaches the bearer token to every request the TestClient makes,
and tears the user/session down when the test session ends.
"""
import os
import uuid

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient

# Load .env so DATABASE_URL/JWT_SECRET are available before app import
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

from app.auth_utils import create_access_token  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Session as SessionModel  # noqa: E402
from app.models import User  # noqa: E402


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Return a TestClient authenticated as a throwaway test user."""
    db = SessionLocal()
    user = User(id=uuid.uuid4(), email=f"pytest-{uuid.uuid4()}@test.local", name="Pytest Runner")
    db.add(user)
    db.commit()

    jti = uuid.uuid4()
    token, expires_at = create_access_token(user.id, jti)
    session_row = SessionModel(id=uuid.uuid4(), user_id=user.id, jti=jti, expires_at=expires_at)
    db.add(session_row)
    db.commit()

    try:
        with TestClient(app, headers={"Authorization": f"Bearer {token}"}) as c:
            yield c
    finally:
        db.query(SessionModel).filter(SessionModel.user_id == user.id).delete()
        db.query(User).filter(User.id == user.id).delete()
        db.commit()
        db.close()
