-- The CLI no longer mints or stores long-lived API keys. It proxies through
-- the browser wizard, which authenticates via the user's Supabase session.
-- This migration drops the now-unused table.

drop table if exists public.cli_api_keys;
