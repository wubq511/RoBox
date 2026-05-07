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

Current MVP behavior:

- `/login` sends Supabase email magic links and enforces `ALLOWED_EMAILS`. GitHub OAuth is the primary login method; Magic Link is the fallback.
- `/auth/github` initiates GitHub OAuth flow via `supabase.auth.signInWithOAuth({ provider: "github" })`.
- `/dashboard`、`/favorites`、`/prompts`、`/skills`、`/tools`、`/settings` require a valid Supabase session.
- Prompt / Skill / Tool pages run against the real repository layer for create, list, detail, edit, favorite, delete, and raw-copy logging.
- Prompt / Skill / Tool detail pages expose manual DeepSeek analyze through `POST /api/items/:id/analyze`; saving raw content still does not call the model.
- Prompt analyze writes `items` metadata and `prompt_variables`; Skill / Tool analyze updates metadata only.
- Prompt detail pages support variable filling, final prompt preview, `copy_final`, and unchanged `copy_raw`.
- `/skills/new` supports GitHub Skill import through `POST /api/import/github`.
- `/tools/new` supports manual Tool save, GitHub Tool import through `POST /api/import/github` with `type: "tool"`, and public HTTPS website import through `POST /api/import/web`.
- GitHub imports only allow `github.com` and `raw.githubusercontent.com`, fetch README/SKILL.md for analysis context, save the submitted URL in `content`, and save the canonical repository link in `source_url`.
- Web Tool import only fetches public HTTPS pages, rejects localhost/private network/IP literal/non-HTTPS targets and blocked redirects, and uses cleaned page text only as analysis context.
- Imported GitHub Skills and linked Tools copy `source_url`; manual Skills and Tools continue to copy raw content.
- Phase 4 was verified on `2026-05-02` with local Supabase and real DeepSeek `deepseek-v4-flash` analyze.
- Phase 5 was verified on `2026-05-02` with local `test/typecheck/lint/build`, live README fetch for `https://github.com/tw93/Waza`, and a browser smoke test against local Supabase + DeepSeek: login by magic link, import Waza, view analyzed Skill detail, copy source URL, search it, reject an invalid GitHub URL, then manually save and copy a Skill.
- Production deployment verified on `2026-05-07`: Supabase cloud project `robox` (`ap-northeast-1`), Vercel production domain `https://robox-beta.vercel.app`, Tools migration applied locally and remotely, 124 tests passing, typecheck/lint/build clean.

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
  Required in production. Local development may omit it and fall back to `http://localhost:3000`; production must set the real app origin, for example the Vercel URL.
- `ALLOWED_EMAILS`
  Required in Phase 2. Comma-separated allowlist for RoBox login, for example `robert@example.com`.

### DeepSeek

- `DEEPSEEK_API_KEY`
  Required for live smart analyze and GitHub import analysis. Server only.
- `DEEPSEEK_MODEL`
  Required. The DeepSeek model name, for example `deepseek-v4-flash`. Server only.
- `DEEPSEEK_API_BASE_URL`
  Optional. Defaults to `https://api.deepseek.com`.

### GitHub

- `GITHUB_TOKEN`
  Optional for GitHub import rate-limit relief. Server only.

### GitHub OAuth (local Supabase)

- `SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID`
  GitHub OAuth App Client ID. Required for local GitHub OAuth login.
- `SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET`
  GitHub OAuth App Client Secret. Required for local GitHub OAuth login.
- `SUPABASE_AUTH_EXTERNAL_GITHUB_REDIRECT_URI`
  GitHub OAuth callback URL for local Supabase. Defaults to `http://127.0.0.1:55421/auth/v1/callback`.

These variables are read by the local Supabase stack from `supabase/config.toml` via `env(...)` substitution. Set them in `.env.local` or your shell environment before running `npm run supabase:start`.

### Environment variable priority

All server-side environment variables are read through `getServerEnv()` (defined in `src/lib/env.ts`). This function prioritizes `.env.local` file values over system `process.env`, preventing system-level environment variables from silently overriding project-local configuration.

## 4. Supabase local development convention

The repository includes the in-repo `supabase/` project and the first migration.

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
- This local setup does not modify CI/CD or production project settings, and it avoids global CLI installation.
- If you use hosted Supabase instead of the local stack, add `http://localhost:3000/auth/confirm` to the project's redirect URLs and keep the email template on `{{ .ConfirmationURL }}` for magic links.

## 5. Directory map

Current code placement:

- `src/app`
  App Router routes and shared route layouts
- `src/app/api`
  Route Handlers, including `POST /api/items/:id/analyze`, `POST /api/import/github`, `POST /api/import/web`, and `GET/POST/DELETE/PATCH /api/categories`
- `src/components/layout`
  App shell, sidebar, mobile nav
- `src/components/dashboard`
  Dashboard-only UI
- `src/components/library`
  Shared Prompt / Skill / Tool library surface
- `src/components/settings`
  Settings page UI
- `src/hooks`
  Shared client-side hooks, including the toast notification system
- `src/features/items`
  Prompt / Skill / Tool types and query-state helpers
- `src/lib`
  Generic helpers, navigation, env readers, shared validation schemas, rate limiter, format utilities
- `src/lib/supabase`
  Browser/server/proxy Supabase client factories
- `src/server/auth`
  Allowlist helpers, session guards, magic link actions
- `src/server/analyze`
  DeepSeek prompt construction, model call, JSON repair/parsing, and analyze persistence
- `src/server/import`
  GitHub Skill/Tool URL validation, README/SKILL.md fetch, public HTTPS web page fetch, import creation, and analysis orchestration
- `src/server/db`
  Supabase-backed repository for `items`, `prompt_variables`, `usage_logs`, and `user_categories`
- `src/server/items`
  Prompt / Skill / Tool form parsing and mutation Server Actions
- `supabase`
  Local config, migration SQL, and seed placeholder
- `supabase/templates`
  Local auth email templates used by the Supabase runtime
- `vendor_imports/tools/supabase`
  Repository-local Supabase CLI binaries, ignored from git

## 6. Dependency boundaries

- UI shell and routes live in Next.js App Router.
- Shadcn/ui remains the only component primitive layer introduced so far.
- Supabase is already wired through SSR clients, the `/login` allowlist flow, the `/auth/confirm` callback, and the server-side `src/server/db` repository layer.
- `/dashboard`、`/favorites`、`/prompts`、`/skills`、`/tools`、`/settings` require a valid Supabase session.
- Prompt / Skill / Tool pages run against the real repository layer for create, list, detail, edit, favorite, delete, and raw-copy logging.
- DeepSeek is wired through a server-only route. Live model calls need a valid `DEEPSEEK_API_KEY`; the model and base URL are read from environment variables (`DEEPSEEK_MODEL`, `DEEPSEEK_API_BASE_URL`).
- GitHub import is wired through a server-only route for Skill/Tool repository links. Web Tool import is a separate server-only route that fetches only public HTTPS pages with redirect, size, timeout, and content-type limits. `GITHUB_TOKEN` is used only when provided.

For architecture and smoke-test details, see `docs/architecture.md` and `docs/integration-guide.md`.

## 8. Vercel deployment

Production is deployed on Vercel. The project name is `robox`.

Required Vercel environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Must include `https://` prefix |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb-xxxx` | From Supabase Dashboard → API |
| `NEXT_PUBLIC_APP_ORIGIN` | `https://robox-beta.vercel.app` | Required in production; errors if missing |
| `ALLOWED_EMAILS` | `user@example.com` | Comma-separated allowlist |
| `DEEPSEEK_API_KEY` | `sk-xxxx` | Server only |
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` | Server only |
| `DEEPSEEK_API_BASE_URL` | `https://api.deepseek.com` | Optional, server only |
| `GITHUB_TOKEN` | `ghp_xxxx` | Optional, server only |

Supabase Auth URL Configuration must include the Vercel domain. Configure through Dashboard or Management API (**do not use `supabase config push`**, it overwrites cloud config):

- Site URL: `https://robox-beta.vercel.app`
- Redirect URLs: `https://robox-beta.vercel.app/auth/confirm`

Production deploys are normally triggered by pushing `main` to GitHub. Manual production deploy command:

```bash
vercel --prod --yes --name robox
```

## 7. MVP route map

Implemented workspace routes:

- `/dashboard`
  Real dashboard snapshot with counts, recent copies, favorites, pending analyze items, and quick-create links.
- `/favorites`
  Unified favorite list for Prompt / Skill / Tool items, with search, type filtering, and updated/used sorting.
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
  Manual Skill create form plus GitHub import form for repository, README, or raw README/SKILL.md links.
- `/skills/[id]`
  Skill detail with source URL metadata when present, raw content, copy feedback, smart analyze, edit, and delete.
- `/skills/[id]/edit`
  Manual Skill edit form.
- `/tools`
  Tool list with the same search/filter/sort contract as prompts and skills.
- `/tools/new`
  Manual Tool create form plus GitHub import and public HTTPS website import forms.
- `/tools/[id]`
  Tool detail with source URL metadata when present, source-link copy/open semantics, smart analyze, edit, and delete.
- `/tools/[id]/edit`
  Manual Tool edit form.
- `/settings`
  Settings page with custom category management (Prompt/Skill/Tool tabs with add, delete, reorder) and external service configuration.
