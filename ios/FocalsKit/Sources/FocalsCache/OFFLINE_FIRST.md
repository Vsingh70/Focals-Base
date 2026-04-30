# FocalsCache: read-only in v1

This package backs the iOS app's list screens with a SwiftData store so
they render in <200ms cold even on slow networks. **Mutations require
connectivity** in v1 — `create/update/delete` calls hit Supabase first,
then update the cache from the server's response. When the device is
offline, mutation calls throw `FocalsAPIError.offline` immediately
(via `requireOnline()`) so the UI can surface a toast instead of hanging
on a 60-second URLSession timeout.

The store file lives in the App Group `group.com.focals.ios` so the
WidgetKit + AppIntents extensions in Task 13 can read it without
re-fetching from Supabase. If the App Group container isn't entitled
(simulator, unsigned build, or any environment without an active
provisioning profile), `CacheContainer` transparently falls back to
`Application Support/`.

Sign-out wipes the per-user store file. The store is named
`cache-<userId>.store`, and `SessionStore.wipeLocalData(userId:)`
captures the previous user's id before clearing the auth state, so a
different user signing in on the same device starts fresh.

## v1.1 plan — write-through outbox

When users start hitting "edit while offline" pain, layer in:

1. A new `MutationOutbox` `@Model` with rows shaped like
   `{ id: UUID, table: String, op: enum {create, update, delete},
     payload: Data (JSON), createdAt: Date, attempts: Int }`.
2. On a mutation while `CacheConnectivity.isOffline == true`:
   - Append to `MutationOutbox`.
   - **Optimistically** apply the mutation to the local SwiftData row
     so the UI updates immediately.
3. A background drain task triggered by:
   - Connectivity flipping to online (`NWPathMonitor` callback).
   - App foreground.
   Drains in `createdAt` order, removing each row on success.
4. **Conflict policy: server-wins.** If a `PUT` returns 409 (or the
   `updated_at` returned by the server differs from what the local
   row had at outbox-write time), discard the queued mutation and log
   it to a Settings → Sync log so the user can see what was lost.
   Don't try to merge — we'd inevitably ship someone's bug as a feature.

## Schema migrations

SwiftData supports versioned `Schema`s + a `SchemaMigrationPlan` for
declaring how to transform between versions. Bump the schema version
when you add or remove a `@Model` field, and add a lightweight
migration that maps the old shape to the new one. Test in
`FocalsTests/CacheMigrationTests.swift` (Task 14 will add the harness).

The unique constraint is `serverId: UUID`. As long as that survives
across versions, lightweight migrations are safe; SwiftData re-builds
the row from scratch by upserting on the next `refresh()`.
