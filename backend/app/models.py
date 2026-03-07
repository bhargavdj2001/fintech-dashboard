"""
SQLAlchemy ORM models — aligned to the existing Supabase schema.
Column names and types match the schema export exactly.
Do NOT run migrations.
"""
import uuid
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from app.database import Base


# ---------------------------------------------------------------------------
# Users & Households
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, nullable=False)
    name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Household(Base):
    __tablename__ = "households"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profiles = relationship("Profile", back_populates="household")
    accounts = relationship("Account", back_populates="household")
    categories = relationship("Category", back_populates="household")
    budgets = relationship("Budget", back_populates="household")
    tags = relationship("Tag", back_populates="household")
    settlements = relationship("Settlement", back_populates="household")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey("households.id"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    default_share = Column(Numeric(5, 4), nullable=True)  # e.g. 0.5000 = 50%
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    household = relationship("Household", back_populates="profiles")
    transaction_splits = relationship("TransactionSplit", back_populates="profile")
    settlements_from = relationship(
        "Settlement", foreign_keys="Settlement.from_profile_id", back_populates="from_profile"
    )
    settlements_to = relationship(
        "Settlement", foreign_keys="Settlement.to_profile_id", back_populates="to_profile"
    )


# ---------------------------------------------------------------------------
# Accounts
# ---------------------------------------------------------------------------

class Account(Base):
    __tablename__ = "accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey("households.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)          # USER-DEFINED enum in DB
    currency = Column(String, nullable=False, default="USD")
    balance = Column(Numeric(14, 2), nullable=False, default=0)
    external_id = Column(String, nullable=True)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    household = relationship("Household", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")
    investments = relationship("Investment", back_populates="account")


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------

class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey("households.id"), nullable=True)
    name = Column(String, nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    is_income = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    household = relationship("Household", back_populates="categories")
    parent = relationship("Category", remote_side="Category.id", foreign_keys=[parent_id])
    transactions = relationship("Transaction", back_populates="category")
    budgets = relationship("Budget", back_populates="category")


# ---------------------------------------------------------------------------
# Transactions
# ---------------------------------------------------------------------------

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey("households.id"), nullable=False)
    created_by_profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)
    title = Column(String, nullable=False)
    merchant = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String, nullable=False, default="USD")
    type = Column(String, nullable=False)           # USER-DEFINED: income | expense | transfer
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    occurred_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, nullable=True, default="cleared")
    is_recurring_instance = Column(Boolean, nullable=False, default=False)
    recurring_rule_id = Column(UUID(as_uuid=True), nullable=True)
    imported_from = Column(String, nullable=True)
    receipt_url = Column(String, nullable=True)
    transfer_group_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    splits = relationship(
        "TransactionSplit", back_populates="transaction", cascade="all, delete-orphan"
    )
    transaction_tags = relationship(
        "TransactionTag", back_populates="transaction", cascade="all, delete-orphan"
    )


class TransactionSplit(Base):
    __tablename__ = "transaction_splits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=False)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    share_amount = Column(Numeric(14, 2), nullable=False)
    share_percent = Column(Numeric(5, 4), nullable=True)
    paid_amount = Column(Numeric(14, 2), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    transaction = relationship("Transaction", back_populates="splits")
    profile = relationship("Profile", back_populates="transaction_splits")


# ---------------------------------------------------------------------------
# Tags
# ---------------------------------------------------------------------------

class Tag(Base):
    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey("households.id"), nullable=False)
    name = Column(String, nullable=False)

    household = relationship("Household", back_populates="tags")
    transaction_tags = relationship("TransactionTag", back_populates="tag")


class TransactionTag(Base):
    __tablename__ = "transaction_tags"

    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), primary_key=True)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.id"), primary_key=True)

    transaction = relationship("Transaction", back_populates="transaction_tags")
    tag = relationship("Tag", back_populates="transaction_tags")


# ---------------------------------------------------------------------------
# Budgets
# ---------------------------------------------------------------------------

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey("households.id"), nullable=False)
    name = Column(String, nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    amount = Column(Numeric(14, 2), nullable=False)
    period_type = Column(String, nullable=False, default="monthly")  # monthly | yearly
    carry_over = Column(Boolean, nullable=False, default=False)
    start_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    household = relationship("Household", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")


# ---------------------------------------------------------------------------
# Investments
# ---------------------------------------------------------------------------

class Investment(Base):
    __tablename__ = "investments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey("households.id"), nullable=True)
    name = Column(String, nullable=False)
    instrument = Column(String, nullable=True)   # USER-DEFINED enum in DB
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    account = relationship("Account", back_populates="investments")
    investment_transactions = relationship("InvestmentTransaction", back_populates="investment")


class InvestmentTransaction(Base):
    __tablename__ = "investment_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    investment_id = Column(UUID(as_uuid=True), ForeignKey("investments.id"), nullable=False)
    txn_type = Column(String, nullable=False)       # buy | sell | dividend
    units = Column(Numeric(18, 8), nullable=True)
    price_per_unit = Column(Numeric(14, 4), nullable=True)
    fees = Column(Numeric(14, 2), nullable=True)
    currency = Column(String, nullable=True)
    occurred_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    investment = relationship("Investment", back_populates="investment_transactions")


# ---------------------------------------------------------------------------
# Recurring rules
# ---------------------------------------------------------------------------

class RecurringRule(Base):
    __tablename__ = "recurring_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey("households.id"), nullable=True)
    freq = Column(String, nullable=True)            # USER-DEFINED: daily | weekly | monthly | yearly
    cron_expr = Column(String, nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    template_txn = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Settlements
# ---------------------------------------------------------------------------

class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey("households.id"), nullable=False)
    from_profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    to_profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    method = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    occurred_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    household = relationship("Household", back_populates="settlements")
    from_profile = relationship(
        "Profile", foreign_keys=[from_profile_id], back_populates="settlements_from"
    )
    to_profile = relationship(
        "Profile", foreign_keys=[to_profile_id], back_populates="settlements_to"
    )
