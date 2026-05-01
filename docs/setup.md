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

Current Phase 2 behavior:

- `/login` sends Supabase email magic links and enforces `ALLOWED_EMAILS`.
- `/dashboard`、`/prompts`、`/skills`、`/settings` require a valid Supabase session.
- Library pages still render static mock data; the server repository is ready for Phase 3 page wiring.

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
  Reserved for the analyze route in Phase 4. Server only.

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

- RoBox pins a repository-local Supabase CLI version and installs it into `.tools/supabase/<version>/supabase.exe`.
- Run `npm run supabase:install` before the first local Supabase command or after changing `package.json > config.supabaseCliVersion`.
- `supabase start` needs Docker and will download images on first run.
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
  Prompt / Skill types and mock data
- `src/lib`
  Generic helpers, navigation, env readers, shared validation schemas
- `src/lib/supabase`
  Browser/server/proxy Supabase client factories
- `src/server/auth`
  Allowlist helpers, session guards, magic link actions
- `src/server/db`
  Supabase-backed repository for `items`, `prompt_variables`, and `usage_logs`
- `supabase`
  Local config, migration SQL, and seed placeholder
- `supabase/templates`
  Local auth email templates used by the Supabase runtime
- `.tools/supabase`
  Repository-local Supabase CLI binaries, ignored from git

Still waiting for later phases:

- DeepSeek analyze routes and prompt variable extraction UI
- GitHub import route and repository README fetch flow
- Phase 3 page wiring from mock data to the new repository layer

## 6. Dependency boundaries

- UI shell and routes live in Next.js App Router.
- Shadcn/ui is the only component primitive layer introduced in Phase 1.
- Supabase is wired only up to client factory level in Phase 1.
- Dashboard / Prompts / Skills / Settings currently read from static mock data.
- DeepSeek and GitHub stay at documentation/env boundary until their phases arrive.
