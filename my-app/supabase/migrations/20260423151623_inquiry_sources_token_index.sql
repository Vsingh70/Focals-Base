-- Fast lookup of inquiry sources by token (stored in config->>'token').
-- The public /api/inquiry endpoint queries by this path to resolve the
-- owning user_id before inserting the inquiry.

create index if not exists inquiry_sources_token_idx
  on public.inquiry_sources ((config->>'token'))
  where is_active = true;
