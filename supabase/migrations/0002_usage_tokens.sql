-- Per-interaction token + cost tracking on usage_events.
-- Run this against your Supabase project (via CLI: `supabase db push`, or paste into SQL editor).
--
-- All columns are nullable so existing rows stay valid and self-host callers
-- (which never populate them) don't break any query that joins on this table.

alter table public.usage_events
  add column if not exists model text,
  add column if not exists input_text_tokens integer,
  add column if not exists input_image_tokens integer,
  add column if not exists output_image_tokens integer,
  add column if not exists cost_usd numeric(10, 6);

-- Handy view for a rolling 30-day cost breakdown per user.
create or replace view public.usage_cost_30d as
  select
    user_id,
    count(*) as events,
    coalesce(sum(cost_usd), 0)::numeric(12, 4) as total_cost_usd,
    coalesce(sum(input_text_tokens), 0) as input_text_tokens,
    coalesce(sum(input_image_tokens), 0) as input_image_tokens,
    coalesce(sum(output_image_tokens), 0) as output_image_tokens
  from public.usage_events
  where created_at >= now() - interval '30 days'
  group by user_id;
