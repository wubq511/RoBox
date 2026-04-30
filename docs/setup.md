# RoBox Setup

## 1. Local start

```bash
npm ci
npm run dev
```

Default local URL:

```text
http://localhost:3000/dashboard
```

`/` redirects to `/dashboard`.

Current Phase 1 behavior:

- UI uses static mock data only.
- Auth, database writes, and DeepSeek analyze are not wired yet.

Verification commands:

```bash
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
- `SUPABASE_SERVICE_ROLE_KEY`
  Reserved for server-only admin operations. Do not expose it to the browser.
- `ALLOWED_EMAILS`
  Reserved for Phase 2 email allowlist auth.

### DeepSeek

- `DEEPSEEK_API_KEY`
  Reserved for the analyze route in Phase 4. Server only.

### GitHub

- `GITHUB_TOKEN`
  Optional for Phase 5 GitHub import and rate-limit relief. Server only.

## 4. Supabase local development convention

Phase 1 only settles the local convention. It does not add auth, schema, or migrations yet.

Recommended commands:

```bash
npm run supabase:install
npm run supabase:init
npm run supabase:start
npm run supabase:status
npm run supabase:stop
```

Notes:

- RoBox pins a repository-local Supabase CLI version and installs it into `.tools/supabase/<version>/supabase.exe`.
- Run `npm run supabase:install` before the first local Supabase command or after changing `package.json > config.supabaseCliVersion`.
- `supabase init` is safe to run inside the repo and will create a `supabase/` folder.
- `supabase start` needs Docker and will download images on first run.
- This phase does not modify CI/CD or production project settings, and it avoids global CLI installation.

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
  Generic helpers, navigation, env readers
- `src/lib/supabase`
  Browser/server Supabase client factories
- `.tools/supabase`
  Repository-local Supabase CLI binaries, ignored from git

Reserved for next phases:

- `src/server/auth`
  Auth gates and allowlist logic
- `src/server/db`
  Data access layer
- `src/lib/schema`
  Validation schemas and enums shared across server/client

## 6. Dependency boundaries

- UI shell and routes live in Next.js App Router.
- Shadcn/ui is the only component primitive layer introduced in Phase 1.
- Supabase is wired only up to client factory level in Phase 1.
- Dashboard / Prompts / Skills / Settings currently read from static mock data.
- DeepSeek and GitHub stay at documentation/env boundary until their phases arrive.
