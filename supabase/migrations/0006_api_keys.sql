-- Personal API keys for the CLI's non-interactive (--ai) mode.
-- Each row is one key belonging to a user. We never store the plaintext key —
-- only sha256(key). The plaintext (`cak_` + 32 random bytes hex) is shown once
-- at creation time in the dashboard, then discarded.

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key_hash text not null unique,          -- sha256 hex of the full plaintext key
  prefix text not null,                   -- e.g. 'cak_a1b2c3' — for display only
  name text,                              -- optional user-supplied label
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

-- Verification looks up active keys by hash; partial index keeps it lean.
create index if not exists api_keys_active_hash_idx
  on public.api_keys (key_hash) where revoked_at is null;

create index if not exists api_keys_user_idx
  on public.api_keys (user_id, created_at desc);

-- RLS: users can read and revoke their own keys. Inserts and hash lookups for
-- verification go through the service role, which bypasses RLS. There is no
-- insert policy on purpose — keys must be minted server-side so the hashing is
-- never client-controlled.
alter table public.api_keys enable row level security;

drop policy if exists "api_keys_select_own" on public.api_keys;
create policy "api_keys_select_own" on public.api_keys
  for select using (auth.uid() = user_id);

drop policy if exists "api_keys_update_own" on public.api_keys;
create policy "api_keys_update_own" on public.api_keys
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
