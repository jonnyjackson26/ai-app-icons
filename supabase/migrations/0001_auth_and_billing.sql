-- Auth + billing schema for ai-app-icons.
-- Run this against your Supabase project (via CLI: `supabase db push`, or paste into SQL editor).

-- Profiles: one row per auth user. Auto-created via trigger on signup.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'pro', 'unlimited')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  subscription_status text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Long-lived API keys for the `create-app-icon` CLI. Plaintext is shown once at mint
-- time and never stored; we keep a sha256 hash for lookups.
create table if not exists public.cli_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists cli_api_keys_user_idx on public.cli_api_keys (user_id);

-- One row per successful OpenAI call (generate or edit). Rolling 7-day counts
-- drive quota enforcement; exports are not tracked.
create table if not exists public.usage_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('generate', 'edit')),
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_time_idx
  on public.usage_events (user_id, created_at desc);

-- Auto-create a profile on user signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at fresh on profiles.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- RLS: users can read their own rows; service role bypasses for writes.
alter table public.profiles enable row level security;
alter table public.cli_api_keys enable row level security;
alter table public.usage_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "cli_api_keys_select_own" on public.cli_api_keys;
create policy "cli_api_keys_select_own" on public.cli_api_keys
  for select using (auth.uid() = user_id);

drop policy if exists "cli_api_keys_delete_own" on public.cli_api_keys;
create policy "cli_api_keys_delete_own" on public.cli_api_keys
  for delete using (auth.uid() = user_id);

drop policy if exists "usage_events_select_own" on public.usage_events;
create policy "usage_events_select_own" on public.usage_events
  for select using (auth.uid() = user_id);
