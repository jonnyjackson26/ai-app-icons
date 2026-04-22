-- Captures end-of-flow star ratings submitted from the export step.
-- One row per submission (users can rate multiple times / multiple chats).

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  chat_id uuid references public.chats(id) on delete set null,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists ratings_user_created_idx
  on public.ratings (user_id, created_at desc);

alter table public.ratings enable row level security;

drop policy if exists "ratings_insert_own_or_anon" on public.ratings;
create policy "ratings_insert_own_or_anon" on public.ratings
  for insert with check (
    (auth.uid() is null and user_id is null)
    or auth.uid() = user_id
  );

drop policy if exists "ratings_select_own" on public.ratings;
create policy "ratings_select_own" on public.ratings
  for select using (auth.uid() = user_id);
