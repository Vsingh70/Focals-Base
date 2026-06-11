# Focals

Freelance-photography business app. Three surfaces, one Supabase backend:

- `my-app/` — Next.js 15 (App Router) + React 19 + TypeScript + Tailwind web app
- `ios/` — SwiftUI app (`Focals/`) + local SPM package (`FocalsKit/`: FocalsAPI, FocalsCache, FocalsModels); Xcode project generated from `project.yml` via XcodeGen
- `my-app/supabase/` — SQL migrations (schema, RLS, triggers)

## Agent dispatch protocol

The main agent acts as orchestrator. Specialist subagents live in `.claude/agents/`. Distribute work by domain, not by convenience:

| Task touches | Route to |
|---|---|
| `my-app/src` (pages, components, server actions, API routes) | `web-dev` |
| `ios/` (SwiftUI, FocalsKit, project.yml) | `ios-dev` |
| `my-app/supabase` (schema, migrations, RLS, edge functions) | `supabase-db` |
| Verifying changes by running builds/tests | `qa-verifier` |
| Reviewing a diff for correctness | `code-reviewer` |
| Auth, RLS, uploads, payments, secrets, deep links | `security-auditor` |

Rules for the orchestrator:

1. **Schema first.** If a task implies a data-model change, run `supabase-db` before the client agents, then fan out its CLIENT IMPACT list to `web-dev` and `ios-dev` (in parallel — they touch disjoint trees).
2. **Specialists don't cross domains.** If a subagent reports work outside its domain (e.g. ios-dev notices a needed migration), route that to the owning agent; don't let one agent do another's job.
3. **Verify before reporting done.** Non-trivial changes get `qa-verifier`; changes to auth/RLS/uploads/financial data also get `security-auditor`. Failures route back to the specialist that owns the file, with the error output verbatim.
4. **Collect CONCERNS / MANUAL STEPS sections** from every subagent report and append them to `USER_TODO.md` (tests to run, security concerns, deferred items, dashboard config) at the end of the task.
5. Small single-file edits in one domain don't need the full pipeline — the orchestrator may edit directly, but rules 3–4 still apply.

## Commands

- Web: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run dev` (from `my-app/`)
- iOS package: `swift build` (from `ios/FocalsKit/`)
- iOS app: `xcodebuild -project Focals.xcodeproj -scheme Focals -destination 'generic/platform=iOS Simulator' build` (from `ios/`); regenerate project with `xcodegen` after editing `project.yml`
