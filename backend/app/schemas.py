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
_VALID_ACCOUNT_TYPES = {"checking", "savings", "credit", "cash", "investment"}
_VALID_INVESTMENT_TXN_TYPES = {"buy", "sell", "dividend"}
_VALID_GOAL_STATUSES = {"on-track", "behind", "completed"}


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
    is_owner: bool = False


class ProfileIn(BaseModel):
    household_id: UUID
    name: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    default_share: Optional[float] = None
    is_owner: bool = False

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name must not be empty")
        return v


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    default_share: Optional[float] = None
    is_owner: Optional[bool] = None


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------

class CategoryOut(OrmBase):
    id: UUID
    name: str
    is_income: bool
    parent_id: Optional[UUID] = None


class CategoryIn(BaseModel):
    household_id: Optional[UUID] = None
    name: str
    parent_id: Optional[UUID] = None
    is_income: bool = False

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name must not be empty")
        return v


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[UUID] = None
    is_income: Optional[bool] = None


# ---------------------------------------------------------------------------
# Account
# ---------------------------------------------------------------------------

class AccountSummaryOut(OrmBase):
    """Lightweight account shape for nesting inside Transaction/Investment —
    avoids computing current_balance (a cross-table aggregate) for every
    row in a transaction list just to show the account's name."""
    id: UUID
    name: str
    type: str
    currency: str


class AccountOut(OrmBase):
    id: UUID
    name: str
    type: str
    currency: str
    opening_balance: float
    current_balance: float = 0.0
    external_id: Optional[str] = None
    last_synced_at: Optional[dt.datetime] = None


class AccountBalanceUpdate(BaseModel):
    balance: float  # the desired CURRENT balance — opening_balance is back-solved


class AccountIn(BaseModel):
    household_id: UUID
    name: str
    type: str
    currency: str = "INR"
    opening_balance: float = 0
    external_id: Optional[str] = None

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in _VALID_ACCOUNT_TYPES:
            raise ValueError(f"type must be one of {_VALID_ACCOUNT_TYPES}")
        return v


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
    currency: str = "INR"
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
    transfer_group_id: Optional[UUID] = None
    receipt_url: Optional[str] = None
    account: Optional[AccountSummaryOut] = None
    category: Optional[CategoryOut] = None
    splits: List[SplitOut] = []
    created_at: Optional[dt.datetime] = None


class TransferIn(BaseModel):
    household_id: UUID
    from_account_id: UUID
    to_account_id: UUID
    title: Optional[str] = None
    amount: float
    currency: str = "INR"
    occurred_at: dt.datetime
    status: str = "cleared"
    created_by_profile_id: Optional[UUID] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be greater than zero")
        return v

    @field_validator("to_account_id")
    @classmethod
    def validate_distinct_accounts(cls, v, info):
        if info.data.get("from_account_id") == v:
            raise ValueError("from_account_id and to_account_id must differ")
        return v


class TransferOut(BaseModel):
    from_transaction: TransactionOut
    to_transaction: TransactionOut


class ImportRowError(BaseModel):
    row: int
    reason: str


class ImportResultOut(BaseModel):
    created: int
    skipped: int
    errors: List[ImportRowError]


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

class SplitSummaryOut(BaseModel):
    your_share: float
    partner_share: float
    you_paid: float
    partner_paid: float
    net_balance: float        # you_paid - your_share (positive = partner owes you)


class PartnerBalanceOut(BaseModel):
    profile_id: UUID
    profile_name: str
    your_share: float
    you_paid: float
    net_balance: float        # positive = this person owes you


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


class NetWorthSnapshotOut(OrmBase):
    snapshot_date: dt.date
    total_assets: float
    total_liabilities: float
    net_worth: float


class NetWorthReportOut(BaseModel):
    history: List[NetWorthSnapshotOut]
    current_total_assets: float
    current_total_liabilities: float
    current_net_worth: float


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
    rollover_amount: float = 0.0
    effective_amount: float = 0.0  # amount + rollover_amount (what's actually available this period)


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
    account: Optional[AccountSummaryOut] = None
    investment_transactions: List[InvestmentTransactionOut] = []


class InvestmentIn(BaseModel):
    household_id: Optional[UUID] = None
    name: str
    instrument: Optional[str] = None
    account_id: Optional[UUID] = None


class InvestmentUpdate(BaseModel):
    name: Optional[str] = None
    instrument: Optional[str] = None
    account_id: Optional[UUID] = None


class InvestmentTransactionIn(BaseModel):
    txn_type: str
    units: Optional[float] = None
    price_per_unit: Optional[float] = None
    fees: Optional[float] = None
    currency: Optional[str] = None
    occurred_at: dt.datetime

    @field_validator("txn_type")
    @classmethod
    def validate_txn_type(cls, v: str) -> str:
        if v not in _VALID_INVESTMENT_TXN_TYPES:
            raise ValueError(f"txn_type must be one of {_VALID_INVESTMENT_TXN_TYPES}")
        return v


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


# ---------------------------------------------------------------------------
# Settlements
# ---------------------------------------------------------------------------

class SettlementIn(BaseModel):
    household_id: UUID
    from_profile_id: UUID
    to_profile_id: UUID
    amount: float
    method: Optional[str] = None
    note: Optional[str] = None
    occurred_at: Optional[dt.datetime] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be greater than zero")
        return v


class SettlementOut(OrmBase):
    id: UUID
    household_id: UUID
    from_profile_id: UUID
    to_profile_id: UUID
    amount: float
    method: Optional[str] = None
    note: Optional[str] = None
    occurred_at: Optional[dt.datetime] = None
    created_at: Optional[dt.datetime] = None
    from_profile: Optional[ProfileOut] = None
    to_profile: Optional[ProfileOut] = None


# ---------------------------------------------------------------------------
# Goals
# ---------------------------------------------------------------------------

class GoalIn(BaseModel):
    household_id: UUID
    name: str
    category: Optional[str] = None
    target_amount: float
    current_amount: float = 0
    monthly_contribution: float = 0
    target_date: Optional[dt.date] = None
    description: Optional[str] = None

    @field_validator("target_amount")
    @classmethod
    def validate_target_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("target_amount must be greater than zero")
        return v


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    target_amount: Optional[float] = None
    monthly_contribution: Optional[float] = None
    target_date: Optional[dt.date] = None
    description: Optional[str] = None
    status: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in _VALID_GOAL_STATUSES:
            raise ValueError(f"status must be one of {_VALID_GOAL_STATUSES}")
        return v


class GoalContribute(BaseModel):
    amount: float

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be greater than zero")
        return v


class GoalOut(OrmBase):
    id: UUID
    household_id: UUID
    name: str
    category: Optional[str] = None
    target_amount: float
    current_amount: float
    monthly_contribution: float
    target_date: Optional[dt.date] = None
    status: str
    description: Optional[str] = None
    created_at: Optional[dt.datetime] = None


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

class SettingsUpdate(BaseModel):
    default_currency: Optional[str] = None
    date_format: Optional[str] = None
    number_format: Optional[str] = None
    fiscal_year_start: Optional[str] = None
    theme: Optional[str] = None
    notifications: Optional[Dict[str, bool]] = None


class SettingsOut(OrmBase):
    id: UUID
    household_id: UUID
    default_currency: str
    date_format: str
    number_format: str
    fiscal_year_start: str
    theme: str
    notifications: Dict[str, bool]
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class RegisterIn(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        return v


class LoginIn(BaseModel):
    email: str
    password: str
    totp_code: Optional[str] = None


class TokenOut(BaseModel):
    access_token: str
    requires_totp: bool = False


class UserOut(OrmBase):
    id: UUID
    email: str
    name: Optional[str] = None
    totp_enabled: bool


class UpdateProfileIn(BaseModel):
    name: Optional[str] = None


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("new_password must be at least 8 characters")
        return v


class TwoFASetupOut(BaseModel):
    secret: str
    provisioning_uri: str
    qr_code_base64: str


class TwoFAVerifyIn(BaseModel):
    code: str


class SessionOut(OrmBase):
    id: UUID
    device: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: Optional[dt.datetime] = None
    last_seen_at: Optional[dt.datetime] = None
    is_current: bool = False


# ---------------------------------------------------------------------------
# Insights — rule-based, computed from real data
# ---------------------------------------------------------------------------

class InsightOut(BaseModel):
    id: str
    type: str
    priority: str
    title: str
    description: str
    action: Optional[str] = None
    action_href: Optional[str] = None
