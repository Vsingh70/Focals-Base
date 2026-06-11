# Cascade rules for clients (and projects)

When a **client** is deleted, Postgres FK rules `ON DELETE SET NULL` linked
records:
- `projects.client_id` → null (project survives, no longer attributed to a client)
- `inquiries.converted_client_id` → null (the inquiry stays converted but the
  link is broken)

When a **project** is deleted:
- `finances.project_id` → null (the income/expense row keeps its amount; only
  the link to the project is cleared)
- `contracts.project_id` → null
- `inquiries.converted_project_id` → null

The web mirrors this — see `my-app/src/lib/actions/clients.ts` and
`my-app/src/lib/actions/projects.ts`. iOS doesn't enforce cascading itself; it
just sends the `DELETE` and re-runs `refresh` on dependent caches so the local
SwiftData store picks up the new null-FK state.

If you ever change to `ON DELETE CASCADE` on the server, update this doc and
the iOS post-delete refresh chain (`ClientsScreen.delete`,
`ProjectDetailScreen.delete`).
