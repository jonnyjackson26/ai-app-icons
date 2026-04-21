-- Deletes the currently authenticated user.
-- SECURITY DEFINER is required because deleting from auth.users requires elevated privileges.

create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users
  where id = auth.uid();
end;
$$;

revoke all on function public.delete_user() from public;
grant execute on function public.delete_user() to authenticated;
