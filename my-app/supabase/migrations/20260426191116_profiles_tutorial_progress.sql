-- tutorial_progress tracks which in-app tours each user has seen.
-- Shape: { "dashboard": true, "inbox": true, ... } where each key is a
-- tour id (matches the page route slug). Defaults to {} so newly created
-- profiles see all tours.

alter table public.profiles
  add column if not exists tutorial_progress jsonb not null default '{}'::jsonb;
