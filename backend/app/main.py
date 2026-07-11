"""
FinancialOS — FastAPI backend entry point.

Start the server:
    uvicorn app.main:app --reload

Swagger UI:
    http://localhost:8000/docs
"""
import datetime as dt
import logging
import os
import time
import uuid
from contextlib import asynccontextmanager

import jwt
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.auth_utils import JWT_ALGORITHM, JWT_SECRET
from app.database import SessionLocal
from app.models import Session as SessionModel
from app.scheduler_utils import advisory_lock
from app.session_cache import cache_session, get_cached_user_id
from app.services.goal_service import apply_contributions as apply_goal_contributions
from app.services.networth_service import take_daily_snapshot
from app.services.recurring_service import materialize_due_rules
from app.routes import (
    accounts,
    analytics,
    auth,
    budgets,
    categories,
    dashboard,
    goals,
    households,
    insights,
    investments,
    profiles,
    recurring,
    reports,
    settings,
    settlements,
    transactions,
)

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("financialos")

# ---------------------------------------------------------------------------
# Background scheduler — materializes due recurring rules and takes a daily
# net worth snapshot. Runs in-process since there's no separate worker
# infra. Each job is guarded by a Postgres advisory lock (see
# scheduler_utils.py) so that if this is ever deployed with multiple worker
# processes, only one worker's job actually runs per tick — the rest no-op.
# ---------------------------------------------------------------------------
scheduler = BackgroundScheduler()

_RECURRING_LOCK_KEY = 1001
_NETWORTH_LOCK_KEY = 1002
_GOAL_CONTRIBUTION_LOCK_KEY = 1003


def _run_recurring_job():
    db = SessionLocal()
    try:
        with advisory_lock(db, _RECURRING_LOCK_KEY) as acquired:
            if not acquired:
                return
            created = materialize_due_rules(db)
            if created:
                logger.info("Recurring job: materialized %d transaction(s)", created)
    finally:
        db.close()


def _run_networth_job():
    db = SessionLocal()
    try:
        with advisory_lock(db, _NETWORTH_LOCK_KEY) as acquired:
            if not acquired:
                return
            take_daily_snapshot(db)
    finally:
        db.close()


def _run_goal_contribution_job():
    db = SessionLocal()
    try:
        with advisory_lock(db, _GOAL_CONTRIBUTION_LOCK_KEY) as acquired:
            if not acquired:
                return
            applied = apply_goal_contributions(db)
            if applied:
                logger.info("Goal contribution job: applied to %d goal(s)", applied)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(_run_recurring_job, "interval", hours=1, id="materialize_recurring")
    scheduler.add_job(_run_networth_job, "cron", hour=23, minute=55, id="daily_net_worth_snapshot")
    scheduler.add_job(_run_goal_contribution_job, "cron", hour=1, minute=0, id="apply_goal_contributions")
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="FinancialOS API",
    description="Backend API for the FinancialOS personal finance dashboard.",
    version="1.0.0",
    lifespan=lifespan,
)


@app.exception_handler(Exception)
async def db_error_handler(request: Request, exc: Exception):
    """Catch DB OperationalErrors (e.g. Supabase paused) and return a clean 503
    instead of dropping the connection, which would cause 'Failed to fetch' in browsers."""
    from sqlalchemy.exc import OperationalError
    if isinstance(exc, OperationalError):
        logger.error("Database unavailable: %s", exc)
        return JSONResponse(
            status_code=503,
            content={"detail": "Service temporarily unavailable — database unreachable"},
        )
    raise exc

# ---------------------------------------------------------------------------
# CORS — registered first so it wraps every other middleware below and
# still attaches CORS headers to early-exit responses (e.g. 401s from the
# auth middleware), not just successful ones.
# ---------------------------------------------------------------------------
_allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
# Add production frontend URL from env if set (e.g. on Render/Vercel)
_frontend_url = os.getenv("FRONTEND_URL")
if _frontend_url:
    _allowed_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request logging middleware
# ---------------------------------------------------------------------------

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s %d  %.1fms",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response

# ---------------------------------------------------------------------------
# Auth middleware — every route requires a valid session token except the
# health check, docs, and the login/register endpoints.
# ---------------------------------------------------------------------------
_PUBLIC_PATHS = {"/", "/docs", "/openapi.json", "/redoc", "/docs/oauth2-redirect", "/auth/login", "/auth/register", "/auth/exists"}


@app.middleware("http")
async def require_auth(request: Request, call_next):
    if (
        request.method == "OPTIONS"
        or request.url.path in _PUBLIC_PATHS
        or request.url.path.startswith("/uploads/")
    ):
        return await call_next(request)

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "Not authenticated"})

    token = auth_header.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})

    jti = uuid.UUID(payload["jti"])

    cached_user_id = get_cached_user_id(jti)
    if cached_user_id is None:
        db = SessionLocal()
        try:
            session = db.query(SessionModel).filter(SessionModel.jti == jti).first()
            if not session or session.revoked or session.expires_at < dt.datetime.now(dt.timezone.utc):
                return JSONResponse(status_code=401, content={"detail": "Session expired or revoked"})
        except Exception as exc:
            logger.error("DB unavailable during session lookup: %s", exc)
            return JSONResponse(
                status_code=503,
                content={"detail": "Service temporarily unavailable — database unreachable"},
            )
        finally:
            db.close()
        cached_user_id = uuid.UUID(payload["sub"])
        cache_session(jti, cached_user_id)

    request.state.user_id = cached_user_id
    request.state.jti = jti
    return await call_next(request)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(accounts.router)
app.include_router(categories.router)
app.include_router(dashboard.router)
app.include_router(budgets.router)
app.include_router(investments.router)
app.include_router(recurring.router)
app.include_router(households.router)
app.include_router(profiles.router)
app.include_router(settlements.router)
app.include_router(goals.router)
app.include_router(settings.router)
app.include_router(insights.router)

# ---------------------------------------------------------------------------
# Static uploads (receipts) — served directly off local disk, no external
# storage service.
# ---------------------------------------------------------------------------
_UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(_UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_UPLOADS_DIR), name="uploads")


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
def root():
    """Health check — confirms the API is running."""
    return {"status": "ok", "service": "FinancialOS API", "version": "1.0.0"}
