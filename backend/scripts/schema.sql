-- Full schema for the FinancialOS fintech dashboard.
-- Recreated from scratch after the original Supabase project was lost.
-- Run once against a fresh database: psql "$DATABASE_URL" -f scripts/schema.sql
-- (or executed programmatically — see scripts/init_db.py)

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Users & Households
-- ---------------------------------------------------------------------------

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  created_at timestamptz not null default now()
);

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid references users(id),
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  email text,
  avatar_url text,
  default_share numeric(5,4),
  is_owner boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index uq_profiles_one_owner_per_household
  on profiles (household_id) where is_owner;

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------

create table accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type text not null check (type in ('checking', 'savings', 'credit', 'cash', 'investment')),
  currency text not null default 'USD',
  -- Balance as of when the account was added to the app. The *current*
  -- balance is opening_balance + a live computation from transactions
  -- (see account_service.py) — never stored, always derived.
  opening_balance numeric(14,2) not null default 0,
  external_id text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------

create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  parent_id uuid references categories(id),
  is_income boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Transactions
-- ---------------------------------------------------------------------------

create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  created_by_profile_id uuid references profiles(id),
  account_id uuid not null references accounts(id) on delete restrict,
  title text not null,
  merchant text,
  description text,
  amount numeric(14,2) not null,
  currency text not null default 'USD',
  type text not null check (type in ('income', 'expense', 'transfer')),
  category_id uuid references categories(id),
  occurred_at timestamptz not null,
  status text default 'cleared' check (status in ('cleared', 'pending')),
  is_recurring_instance boolean not null default false,
  recurring_rule_id uuid,
  imported_from text,
  receipt_url text,
  transfer_group_id uuid,
  created_at timestamptz not null default now()
);

create index idx_transactions_household_id on transactions(household_id);
create index idx_transactions_account_id on transactions(account_id);
create index idx_transactions_occurred_at on transactions(occurred_at);

create table transaction_splits (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  share_amount numeric(14,2) not null,
  share_percent numeric(5,4),
  paid_amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Budgets
-- ---------------------------------------------------------------------------

create table budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  category_id uuid references categories(id),
  amount numeric(14,2) not null,
  period_type text not null default 'monthly' check (period_type in ('monthly', 'yearly')),
  carry_over boolean not null default false,
  start_date date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Investments
-- ---------------------------------------------------------------------------

create table investments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  instrument text check (instrument in ('stock', 'etf', 'mutual_fund', 'crypto', 'bond', 'gold')),
  account_id uuid references accounts(id),
  created_at timestamptz not null default now()
);

create table investment_transactions (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references investments(id) on delete cascade,
  txn_type text not null check (txn_type in ('buy', 'sell', 'dividend')),
  units numeric(18,8),
  price_per_unit numeric(14,4),
  fees numeric(14,2),
  currency text,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Recurring rules
-- ---------------------------------------------------------------------------

create table recurring_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  freq text check (freq in ('daily', 'weekly', 'monthly', 'yearly')),
  cron_expr text,
  next_run_at timestamptz,
  is_active boolean not null default true,
  template_txn jsonb,
  created_at timestamptz not null default now()
);

-- transactions.recurring_rule_id can't reference recurring_rules until this
-- table exists, so the FK is added here rather than inline above.
alter table transactions
  add constraint fk_transactions_recurring_rule
  foreign key (recurring_rule_id) references recurring_rules(id)
  on delete set null;

-- ---------------------------------------------------------------------------
-- Net worth snapshots — daily history for the Reports Net Worth tab
-- ---------------------------------------------------------------------------

create table net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  snapshot_date date not null,
  total_assets numeric(14,2) not null,
  total_liabilities numeric(14,2) not null,
  net_worth numeric(14,2) not null,
  created_at timestamptz not null default now(),
  unique (household_id, snapshot_date)
);

create index idx_net_worth_snapshots_household_date
  on net_worth_snapshots (household_id, snapshot_date);

-- ---------------------------------------------------------------------------
-- Settlements
-- ---------------------------------------------------------------------------

create table settlements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  from_profile_id uuid not null references profiles(id),
  to_profile_id uuid not null references profiles(id),
  amount numeric(14,2) not null,
  method text,
  note text,
  occurred_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Goals (new)
-- ---------------------------------------------------------------------------

create table goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  category text,
  target_amount numeric(14,2) not null,
  current_amount numeric(14,2) not null default 0,
  monthly_contribution numeric(14,2) not null default 0,
  target_date date,
  status text not null default 'on-track' check (status in ('on-track', 'behind', 'completed')),
  description text,
  -- "YYYY-MM" of the last month the auto-contribute job applied
  -- monthly_contribution, so it never double-applies in the same month.
  last_contributed_period text,
  created_at timestamptz not null default now()
);

create index idx_goals_household_id on goals(household_id);

-- ---------------------------------------------------------------------------
-- User settings (new) — one row per household
-- ---------------------------------------------------------------------------

create table user_settings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null unique references households(id) on delete cascade,
  default_currency text not null default 'USD',
  date_format text not null default 'mdy',
  number_format text not null default 'us',
  fiscal_year_start text not null default 'jan',
  theme text not null default 'dark',
  notifications jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
