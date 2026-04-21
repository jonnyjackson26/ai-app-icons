-- Stores Expo push tokens per device so the backend can send targeted
-- push notifications. One user can have many devices; the unique constraint
-- on `token` prevents duplicates and lets us upsert on re-registration.

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  device_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint push_tokens_token_unique unique (token)
);

create index if not exists push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

-- updated_at trigger (same pattern as profiles)
create or replace function public.set_push_tokens_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_push_tokens_updated_at on public.push_tokens;
create trigger set_push_tokens_updated_at
before update on public.push_tokens
for each row
execute function public.set_push_tokens_updated_at();

-- RLS policies scoped to user_id = auth.uid()

drop policy if exists "Users can read their own push tokens" on public.push_tokens;
create policy "Users can read their own push tokens"
on public.push_tokens
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert their own push tokens" on public.push_tokens;
create policy "Users can insert their own push tokens"
on public.push_tokens
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update their own push tokens" on public.push_tokens;
create policy "Users can update their own push tokens"
on public.push_tokens
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their own push tokens" on public.push_tokens;
create policy "Users can delete their own push tokens"
on public.push_tokens
for delete
to authenticated
using (user_id = auth.uid());

grant select, insert, update, delete on table public.push_tokens to authenticated;
