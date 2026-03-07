"""
Pytest configuration and shared fixtures for the FinancialOS API test suite.

Uses httpx.AsyncClient against the live FastAPI app (no test DB — reads from
the real Supabase instance).  Tests are READ-ONLY: no POST that mutates
lasting state.  The one POST /transactions test creates a transaction and is
idempotent enough for CI validation purposes.
"""
import os
import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient

# Load .env so DATABASE_URL is available before app import
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

from app.main import app  # noqa: E402  (must come after load_dotenv)


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Return a synchronous TestClient wrapping the FastAPI app."""
    with TestClient(app) as c:
        yield c
