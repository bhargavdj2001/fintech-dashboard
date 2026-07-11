-- Round 2 schema additions: profile ownership flag, net worth history,
-- and a real FK on the recurring-rule link.
-- Run once: psql "$DATABASE_URL" -f scripts/round2_schema.sql

-- ---------------------------------------------------------------------------
-- profiles.is_owner — exactly one "self" profile per household
-- ---------------------------------------------------------------------------

alter table profiles add column if not exists is_owner boolean not null default false;

-- One-time backfill: flag the owner profile per household. Ties on
-- created_at (e.g. seed-inserted in the same transaction) are broken by
-- preferring a profile literally named "Bhargav" — the original hardcoded
-- "self" identity this migration is replacing — then falling back to id
-- for full determinism.
with ranked as (
  select id, household_id,
         row_number() over (
           partition by household_id
           order by (name = 'Bhargav') desc, created_at asc, id asc
         ) as rn
  from profiles
)
update profiles
set is_owner = true
where id in (select id from ranked where rn = 1);

-- Guard rail: at most one owner per household, enforced at the DB level.
create unique index if not exists uq_profiles_one_owner_per_household
  on profiles (household_id) where is_owner;

-- ---------------------------------------------------------------------------
-- net_worth_snapshots — daily history for the Reports Net Worth tab
-- ---------------------------------------------------------------------------

create table if not exists net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  snapshot_date date not null,
  total_assets numeric(14,2) not null,
  total_liabilities numeric(14,2) not null,
  net_worth numeric(14,2) not null,
  created_at timestamptz not null default now(),
  unique (household_id, snapshot_date)
);

create index if not exists idx_net_worth_snapshots_household_date
  on net_worth_snapshots (household_id, snapshot_date);

-- ---------------------------------------------------------------------------
-- transactions.recurring_rule_id — add the real FK now that automation
-- will start populating it
-- ---------------------------------------------------------------------------

alter table transactions
  add constraint fk_transactions_recurring_rule
  foreign key (recurring_rule_id) references recurring_rules(id)
  on delete set null;
