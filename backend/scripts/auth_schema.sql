-- Auth additions: password login, TOTP 2FA, session tracking.
-- Run once: psql "$DATABASE_URL" -f scripts/auth_schema.sql

alter table users add column if not exists password_hash text;
alter table users add column if not exists totp_secret text;
alter table users add column if not exists totp_enabled boolean not null default false;

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  jti uuid not null unique,
  device text,
  user_agent text,
  ip_address text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked boolean not null default false
);

create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_jti on sessions(jti);
