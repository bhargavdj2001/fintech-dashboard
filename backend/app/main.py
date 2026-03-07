"""
FinancialOS — FastAPI backend entry point.

Start the server:
    uvicorn app.main:app --reload

Swagger UI:
    http://localhost:8000/docs
"""
import logging
import os
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.routes import (
    accounts,
    analytics,
    budgets,
    categories,
    dashboard,
    households,
    investments,
    recurring,
    reports,
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

app = FastAPI(
    title="FinancialOS API",
    description="Backend API for the FinancialOS personal finance dashboard.",
    version="1.0.0",
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
# CORS — allow the Next.js dev server and production frontend
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
# Routers
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
def root():
    """Health check — confirms the API is running."""
    return {"status": "ok", "service": "FinancialOS API", "version": "1.0.0"}
