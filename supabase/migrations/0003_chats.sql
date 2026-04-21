-- Persistent chat history for the wizard. Each chat owns a transcript of
-- messages plus the wizard state (mode, current icon pointer, background
-- config, exported assets) so reopening a chat restores the full experience.
--
-- Images are stored in the 'chat-icons' Supabase Storage bucket (see 0004);
-- only path references live here.

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  title_is_custom boolean not null default false,
  mode text,
  current_icon_path text,
  background_config jsonb,
  assets jsonb,
  expo_config jsonb,
  background_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists chats_user_last_idx
  on public.chats (user_id, last_message_at desc)
  where deleted_at is null;

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  -- Denormalized from chats for simpler RLS (policy checks only this table).
  user_id uuid not null references auth.users(id) on delete cascade,
  seq bigint generated always as identity,
  role text not null check (role in ('user', 'assistant')),
  kind text not null check (kind in ('text', 'icon', 'attach')),
  content text,
  caption text,
  instruction text,
  image_path text,
  tone text check (tone in ('normal', 'error')),
  cta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_chat_seq_idx
  on public.chat_messages (chat_id, seq);

-- Keep chats.updated_at / last_message_at fresh as messages arrive.
create or replace function public.chat_messages_touch_parent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chats
     set last_message_at = now(),
         updated_at = now()
   where id = new.chat_id;
  return new;
end;
$$;

drop trigger if exists chat_messages_touch_parent on public.chat_messages;
create trigger chat_messages_touch_parent
  after insert on public.chat_messages
  for each row execute function public.chat_messages_touch_parent();

-- Auto-title from the first user text message until the user renames manually.
create or replace function public.chat_messages_autotitle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived text;
  trimmed text;
  space_idx integer;
begin
  if new.role <> 'user' or new.kind <> 'text' or coalesce(new.content, '') = '' then
    return new;
  end if;

  derived := left(new.content, 40);
  -- Trim at word boundary if we truncated mid-word.
  if length(new.content) > 40 then
    space_idx := length(derived) - position(' ' in reverse(derived)) + 1;
    if space_idx > 20 then
      trimmed := rtrim(substring(derived from 1 for space_idx - 1));
      if length(trimmed) > 0 then
        derived := trimmed;
      end if;
    end if;
  end if;

  update public.chats
     set title = derived
   where id = new.chat_id
     and title_is_custom = false
     and title = 'New chat';

  return new;
end;
$$;

drop trigger if exists chat_messages_autotitle on public.chat_messages;
create trigger chat_messages_autotitle
  after insert on public.chat_messages
  for each row execute function public.chat_messages_autotitle();

-- Keep updated_at fresh on chats themselves (for PATCH flows).
drop trigger if exists chats_touch_updated_at on public.chats;
create trigger chats_touch_updated_at
  before update on public.chats
  for each row execute function public.touch_updated_at();

-- RLS: a user can only see/modify their own rows. Service role bypasses.
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "chats_select_own" on public.chats;
create policy "chats_select_own" on public.chats
  for select using (auth.uid() = user_id);

drop policy if exists "chats_insert_own" on public.chats;
create policy "chats_insert_own" on public.chats
  for insert with check (auth.uid() = user_id);

drop policy if exists "chats_update_own" on public.chats;
create policy "chats_update_own" on public.chats
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "chats_delete_own" on public.chats;
create policy "chats_delete_own" on public.chats
  for delete using (auth.uid() = user_id);

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own" on public.chat_messages
  for select using (auth.uid() = user_id);

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own" on public.chat_messages
  for insert with check (auth.uid() = user_id);

drop policy if exists "chat_messages_update_own" on public.chat_messages;
create policy "chat_messages_update_own" on public.chat_messages
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "chat_messages_delete_own" on public.chat_messages;
create policy "chat_messages_delete_own" on public.chat_messages
  for delete using (auth.uid() = user_id);
