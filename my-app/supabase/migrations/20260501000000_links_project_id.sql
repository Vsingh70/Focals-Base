-- =============================================================
-- Add project_id to links so a saved link can be associated with a
-- specific project. Today every link is user-scoped only.
--
-- on delete set null: deleting a project preserves the link but clears
-- the association — matches how finances.project_id behaves.
-- =============================================================

alter table public.links
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists links_project_id_idx on public.links(project_id);
