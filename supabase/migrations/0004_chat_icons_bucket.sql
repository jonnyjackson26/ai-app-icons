-- Supabase Storage bucket for chat-scoped images: generated icons, user
-- attachments, and exported assets. Private — all access via signed URLs.
--
-- Path layout:
--   {user_id}/{chat_id}/{message_id}.png             -- assistant icons
--   {user_id}/{chat_id}/attachments/{message_id}.png -- user-uploaded refs
--   {user_id}/{chat_id}/assets/{name}.png            -- exported assets
--
-- RLS is path-prefix-scoped: users may only touch objects under their own
-- user_id prefix. Verified via storage.foldername(name)[1].

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-icons',
  'chat-icons',
  false,
  10485760, -- 10 MiB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "chat_icons_select_own" on storage.objects;
create policy "chat_icons_select_own" on storage.objects
  for select using (
    bucket_id = 'chat-icons'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "chat_icons_insert_own" on storage.objects;
create policy "chat_icons_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'chat-icons'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "chat_icons_update_own" on storage.objects;
create policy "chat_icons_update_own" on storage.objects
  for update using (
    bucket_id = 'chat-icons'
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'chat-icons'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "chat_icons_delete_own" on storage.objects;
create policy "chat_icons_delete_own" on storage.objects
  for delete using (
    bucket_id = 'chat-icons'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
