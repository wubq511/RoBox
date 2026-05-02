# RoBox Setup

## 1. Local start

```bash
npm ci
npm run dev
```

Default local URL:

```text
http://localhost:3000/login
```

`/` redirects to `/dashboard`, and unauthenticated workspace requests redirect to `/login`.

Current Phase 4 behavior:

- `/login` sends Supabase email magic links and enforces `ALLOWED_EMAILS`.
- `/dashboard`、`/prompts`、`/skills`、`/settings` require a valid Supabase session.
- Prompt / Skill pages now run against the real repository layer for create, list, detail, edit, favorite, delete, and raw-copy logging.
- Prompt / Skill detail pages expose manual DeepSeek analyze through `POST /api/items/:id/analyze`; saving raw content still does not call the model.
- Prompt analyze writes `items` metadata and `prompt_variables`; Skill analyze updates metadata only.
- Prompt detail pages support variable filling, final prompt preview, `copy_final`, and unchanged `copy_raw`.

Verification commands:

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

## 2. Runtime requirements

- Node.js `20.9+`
- npm `10+`
- Docker Desktop or another Docker-compatible runtime if you want to run Supabase locally

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill only the values you actually need for the current phase.

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
  Used by the browser/server SSR clients in `src/lib/supabase`.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  Public key used by `@supabase/ssr`.
- `NEXT_PUBLIC_APP_ORIGIN`
  Optional override for login callback origin building. Defaults to `http://localhost:3000`.
- `SUPABASE_SERVICE_ROLE_KEY`
  Reserved for server-only admin operations. Do not expose it to the browser.
- `ALLOWED_EMAILS`
  Required in Phase 2. Comma-separated allowlist for RoBox login, for example `robert@example.com`.

### DeepSeek

- `DEEPSEEK_API_KEY`
  Required for the analyze route in Phase 4. Server only.
- `DEEPSEEK_MODEL`
  Optional. Defaults to `deepseek-v4-flash`.
- `DEEPSEEK_API_BASE_URL`
  Optional. Defaults to `https://api.deepseek.com`.

### GitHub

- `GITHUB_TOKEN`
  Optional for Phase 5 GitHub import and rate-limit relief. Server only.

## 4. Supabase local development convention

Phase 2 now includes the in-repo `supabase/` project and the first migration.

Recommended commands:

```bash
npm run supabase:install
npm run supabase:start
npm run supabase:status
npm run supabase:stop
```

Notes:

- RoBox pins a repository-local Supabase CLI version and installs it into `vendor_imports/tools/supabase/<version>/supabase.exe`.
- Use the stable entrypoints in `scripts/setup-supabase-cli.ps1` and `scripts/run-supabase.ps1` through the npm scripts above instead of calling the versioned binary path directly.
- Run `npm run supabase:install` before the first local Supabase command or after changing `package.json > config.supabaseCliVersion`.
- `supabase start` needs Docker and will download images on first run.
- The local stack intentionally uses `5542x` ports: API `55421`, Studio `55423`, Mailpit `55424`, Postgres `55432`.
- Local auth callback settings already live in `supabase/config.toml`, including `/auth/confirm`.
- Local magic-link emails use `supabase/templates/magic_link.html` so the link lands on `/auth/confirm?token_hash=...` and works with the SSR callback route.
- This phase does not modify CI/CD or production project settings, and it avoids global CLI installation.
- If you use hosted Supabase instead of the local stack, add `http://localhost:3000/auth/confirm` to the project's redirect URLs and keep the email template on `{{ .ConfirmationURL }}` for magic links.

## 5. Directory map

Current code placement:

- `src/app`
  App Router routes and shared route layouts
- `src/components/layout`
  App shell, sidebar, mobile nav
- `src/components/dashboard`
  Dashboard-only UI
- `src/components/library`
  Shared Prompt / Skill library surface
- `src/components/settings`
  Settings page UI
- `src/features/items`
  Prompt / Skill types and query-state helpers
- `src/lib`
  Generic helpers, navigation, env readers, shared validation schemas
- `src/lib/supabase`
  Browser/server/proxy Supabase client factories
- `src/server/auth`
  Allowlist helpers, session guards, magic link actions
- `src/server/db`
  Supabase-backed repository for `items`, `prompt_variables`, and `usage_logs`
- `src/server/items`
  Prompt / Skill form parsing and mutation Server Actions
- `supabase`
  Local config, migration SQL, and seed placeholder
- `supabase/templates`
  Local auth email templates used by the Supabase runtime
- `vendor_imports/tools/supabase`
  Repository-local Supabase CLI binaries, ignored from git

Still waiting for later phases:

- GitHub import route and repository README fetch flow

## 6. Dependency boundaries

- UI shell and routes live in Next.js App Router.
- Shadcn/ui remains the only component primitive layer introduced so far.
- Supabase is already wired through SSR clients, the `/login` allowlist flow, the `/auth/confirm` callback, and the server-side `src/server/db` repository layer.
- `/dashboard`、`/prompts`、`/skills`、`/settings` require a valid Supabase session.
- Prompt / Skill pages now run against the real repository layer for create, list, detail, edit, favorite, delete, and raw-copy logging.
- DeepSeek is wired through a server-only route and still needs a valid `DEEPSEEK_API_KEY` for live model calls.
- GitHub stays at documentation/env boundary until Phase 5.

## 7. Phase 3 route map

Implemented workspace routes:

- `/dashboard`
  Real dashboard snapshot with counts, recent copies, favorites, pending analyze items, and quick-create links.
- `/prompts`
  Prompt list with keyword search, category, tag, favorite filter, and updated/used sorting.
- `/prompts/new`
  Prompt create form. Title and summary can stay blank; raw content is required.
- `/prompts/[id]`
  Prompt detail with metadata, variable filling, final prompt preview, raw/final copy feedback, smart analyze, edit, and delete.
- `/prompts/[id]/edit`
  Prompt edit form with variable-definition editing.
- `/skills`
  Skill list with the same search/filter/sort contract as prompts.
- `/skills/new`
  Manual Skill create form. GitHub import remains Phase 5.
- `/skills/[id]`
  Skill detail with source URL metadata when present, raw content, copy feedback, smart analyze, edit, and delete.
- `/skills/[id]/edit`
  Manual Skill edit form.
