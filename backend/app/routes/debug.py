import os
import subprocess

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
import jwt as pyjwt

from app.database import get_db, engine
from app.auth_utils import JWT_SECRET, JWT_ALGORITHM

router = APIRouter(prefix="/debug", tags=["Debug"])


@router.get("/info", include_in_schema=False)
def debug_info(request: Request, db: Session = Depends(get_db)):
    if os.getenv("ENABLE_DEBUG") != "true":
        raise HTTPException(status_code=404, detail="Not found")

    # Authenticated user — optional; works even without a valid token
    auth_user = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            token = auth_header.removeprefix("Bearer ").strip()
            payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            from app.models import User, Household
            user = db.query(User).filter(User.id == payload["sub"]).first()
            if user:
                h = db.query(Household).filter(Household.owner_user_id == user.id).first()
                auth_user = {
                    "user_id": str(user.id),
                    "email": user.email,
                    "household_id": str(h.id) if h else None,
                    "household_owner_user_id": str(h.owner_user_id) if h else None,
                }
        except Exception as exc:
            auth_user = {"error": str(exc)}

    # DB connection info — password is never included
    url = engine.url
    db_info = {
        "host": str(url.host or ""),
        "port": str(url.port or ""),
        "username": str(url.username or ""),
        "database": str(url.database or ""),
    }

    # Row counts for every major table
    tables = [
        "users", "households", "accounts", "transactions", "budgets",
        "categories", "investments", "goals", "recurring_rules",
        "profiles", "sessions", "net_worth_snapshots",
    ]
    row_counts = {}
    for t in tables:
        try:
            row_counts[t] = db.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
        except Exception:
            row_counts[t] = "error"

    # Detect whether seed.py was ever run (its household name is hardcoded)
    try:
        from app.models import Household
        seed_household = db.query(Household).filter(
            Household.name == "Bhargav & Partner Household"
        ).first()
        seed_py_was_run = seed_household is not None
    except Exception:
        seed_py_was_run = None

    # Git commit of the running code
    try:
        git_commit = subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except Exception:
        git_commit = "unknown"

    return {
        "db": db_info,
        "environment": os.getenv("ENVIRONMENT", "production"),
        "frontend_url_env": os.getenv("FRONTEND_URL", "NOT SET"),
        "enable_debug": os.getenv("ENABLE_DEBUG", "false"),
        "authenticated_user": auth_user,
        "row_counts": row_counts,
        "data_source": "SQL (no mock data in application code)",
        "seed_py_was_run": seed_py_was_run,
        "git_commit": git_commit,
    }
