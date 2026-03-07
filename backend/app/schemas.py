"""
Pydantic v2 schemas — aligned to the corrected models and real DB schema.

All monetary Decimal fields are serialized as float in response schemas to
avoid the string-representation issue in Pydantic v2.
"""
from __future__ import annotations

import datetime as dt
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

_VALID_TXN_TYPES = {"income", "expense", "transfer"}
_VALID_PERIOD_TYPES = {"monthly", "yearly"}


# ---------------------------------------------------------------------------
# Shared config
# ---------------------------------------------------------------------------

class OrmBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Household
# ---------------------------------------------------------------------------

class HouseholdOut(OrmBase):
    id: UUID
    name: str


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

class ProfileOut(OrmBase):
    id: UUID
    name: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    default_share: Optional[float] = None


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------

class CategoryOut(OrmBase):
    id: UUID
    name: str
    is_income: bool
    parent_id: Optional[UUID] = None


# ---------------------------------------------------------------------------
# Account
# ---------------------------------------------------------------------------

class AccountOut(OrmBase):
    id: UUID
    name: str
    type: str
    currency: str
    balance: float
    external_id: Optional[str] = None
    last_synced_at: Optional[dt.datetime] = None


class AccountBalanceUpdate(BaseModel):
    balance: float


# ---------------------------------------------------------------------------
# Tag
# ---------------------------------------------------------------------------

class TagOut(OrmBase):
    id: UUID
    name: str


# ---------------------------------------------------------------------------
# Transaction split
# ---------------------------------------------------------------------------

class SplitIn(BaseModel):
    profile_id: UUID
    share_amount: float
    share_percent: Optional[float] = None
    paid_amount: float = 0.0


class SplitOut(OrmBase):
    id: UUID
    profile_id: UUID
    share_amount: float
    share_percent: Optional[float] = None
    paid_amount: float
    profile: Optional[ProfileOut] = None


# ---------------------------------------------------------------------------
# Transaction
# ---------------------------------------------------------------------------

class TransactionIn(BaseModel):
    household_id: UUID
    account_id: UUID
    title: str
    description: Optional[str] = None
    amount: float
    currency: str = "USD"
    type: str                               # income | expense | transfer
    category_id: Optional[UUID] = None
    occurred_at: dt.datetime
    merchant: Optional[str] = None
    status: str = "cleared"
    created_by_profile_id: Optional[UUID] = None
    splits: List[SplitIn] = []

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in _VALID_TXN_TYPES:
            raise ValueError(f"type must be one of {_VALID_TXN_TYPES}")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be greater than zero")
        return v

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("title must not be empty")
        return v


class TransactionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    merchant: Optional[str] = None
    category_id: Optional[UUID] = None
    status: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    occurred_at: Optional[dt.datetime] = None


class TransactionOut(OrmBase):
    id: UUID
    household_id: UUID
    account_id: UUID
    title: str
    description: Optional[str] = None
    amount: float
    currency: str
    type: str
    occurred_at: dt.datetime
    merchant: Optional[str] = None
    status: Optional[str] = None
    is_recurring_instance: bool = False
    category_id: Optional[UUID] = None
    created_by_profile_id: Optional[UUID] = None
    account: Optional[AccountOut] = None
    category: Optional[CategoryOut] = None
    splits: List[SplitOut] = []
    created_at: Optional[dt.datetime] = None


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

class SplitSummaryOut(BaseModel):
    your_share: float
    partner_share: float
    you_paid: float
    partner_paid: float
    net_balance: float        # you_paid - your_share (positive = partner owes you)


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

class PeriodReportOut(BaseModel):
    total_income: float
    total_expense: float
    net_cashflow: float
    transaction_count: int
    category_summary: Dict[str, float]
    transactions: List[TransactionOut]


# ---------------------------------------------------------------------------
# Budgets
# ---------------------------------------------------------------------------

class BudgetIn(BaseModel):
    household_id: UUID
    name: str
    category_id: Optional[UUID] = None
    amount: float
    period_type: str = "monthly"   # monthly | yearly
    carry_over: bool = False
    start_date: Optional[dt.date] = None

    @field_validator("period_type")
    @classmethod
    def validate_period_type(cls, v: str) -> str:
        if v not in _VALID_PERIOD_TYPES:
            raise ValueError(f"period_type must be one of {_VALID_PERIOD_TYPES}")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be greater than zero")
        return v


class BudgetUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[UUID] = None
    amount: Optional[float] = None
    period_type: Optional[str] = None
    carry_over: Optional[bool] = None
    start_date: Optional[dt.date] = None


class BudgetOut(OrmBase):
    id: UUID
    household_id: UUID
    name: str
    category_id: Optional[UUID] = None
    amount: float
    period_type: str
    carry_over: bool
    start_date: Optional[dt.date] = None
    created_at: Optional[dt.datetime] = None
    category: Optional[CategoryOut] = None
    spent: float = 0.0


# ---------------------------------------------------------------------------
# Investments
# ---------------------------------------------------------------------------

class InvestmentTransactionOut(OrmBase):
    id: UUID
    txn_type: str
    units: Optional[float] = None
    price_per_unit: Optional[float] = None
    fees: Optional[float] = None
    currency: Optional[str] = None
    occurred_at: dt.datetime


class InvestmentOut(OrmBase):
    id: UUID
    household_id: Optional[UUID] = None
    name: str
    instrument: Optional[str] = None
    account_id: Optional[UUID] = None
    created_at: Optional[dt.datetime] = None
    account: Optional[AccountOut] = None
    investment_transactions: List[InvestmentTransactionOut] = []


# ---------------------------------------------------------------------------
# Recurring rules
# ---------------------------------------------------------------------------

class RecurringIn(BaseModel):
    household_id: UUID
    freq: str = "monthly"
    title: str
    amount: float
    type: str = "expense"
    account_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    next_run_at: Optional[dt.datetime] = None
    is_active: bool = True


class RecurringUpdate(BaseModel):
    is_active: Optional[bool] = None
    freq: Optional[str] = None
    next_run_at: Optional[dt.datetime] = None


class RecurringRuleOut(OrmBase):
    id: UUID
    household_id: Optional[UUID] = None
    freq: Optional[str] = None
    cron_expr: Optional[str] = None
    next_run_at: Optional[dt.datetime] = None
    is_active: bool = True
    template_txn: Optional[Any] = None
    created_at: Optional[dt.datetime] = None


# ---------------------------------------------------------------------------
# Dashboard summary
# ---------------------------------------------------------------------------

class DashboardSummaryOut(BaseModel):
    total_balance: float
    monthly_income: float
    monthly_expense: float
    net_cashflow: float
    recent_transactions: List[TransactionOut]
    category_breakdown: Dict[str, float]


# ---------------------------------------------------------------------------
# Pagination wrapper
# ---------------------------------------------------------------------------

class PaginatedTransactions(BaseModel):
    total: int
    limit: int
    offset: int
    items: List[TransactionOut]
