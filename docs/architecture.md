# RoBox Architecture

RoBox is a personal Prompt / Skill manager. The product boundary is intentionally small: save, organize, search, and copy reusable `prompt` and `skill` content.

## System Boundaries

- `prompt` and `skill` are the only supported item types.
- The original user input is stored in `items.content` and must not be overwritten by model output.
- AI analysis enriches metadata and variables; it does not replace the source text.
- Copy behavior is split between raw copy and final prompt copy so usage logs stay explicit.
- GitHub-imported Skills store the submitted link in `items.content` and the canonical repository link in `items.source_url`; fetched README content is analysis context, not the saved original.

## Runtime Layers

- `src/app`
  Next.js App Router pages, route layouts, and API Route Handlers.
- `src/components`
  Dashboard, library, settings, and shared UI components.
- `src/hooks`
  Shared client-side hooks, including the toast notification system (`useToast`).
- `src/features/items`
  Item query-state parsing and Prompt / Skill feature types.
- `src/lib`
  Environment readers, schemas, navigation helpers, Supabase client factories, and generic utilities.
- `src/server/auth`
  Supabase Auth allowlist checks and session guards.
- `src/server/db`
  Supabase repository functions for `items`, `prompt_variables`, `usage_logs`, and `user_categories`.
- `src/server/items`
  Form parsing and Server Actions for create, update, delete, favorite, and copy logging.
- `src/server/analyze`
  DeepSeek prompt construction, model call, JSON repair/parsing, and persistence orchestration.
- `src/server/import`
  GitHub URL validation, raw README/SKILL.md fetch, Skill creation, and README-based analysis orchestration.
- `src/lib/rate-limit`
  IP-based sliding-window rate limiter used by API Route Handlers.
- `middleware.ts` (project root)
  Next.js 16 middleware entry point using `src/lib/supabase/proxy.ts` for Supabase session refresh on every matched request. Runs in Edge Runtime; does not use `node:fs` or `env.ts`.

## Data Model

The MVP data model is centered on four Supabase tables:

- `items`
  The unified Prompt / Skill entity. Important fields include `type`, `title`, `summary`, `content`, `category`, `tags`, `source_url`, `is_favorite`, `is_analyzed`, and `usage_count`. The `category` field stores free-text values validated against the user's custom categories in `user_categories`.
- `user_categories`
  Per-user custom category definitions, scoped by item type (`prompt` or `skill`). Each user can independently manage their Prompt and Skill categories. New users are seeded with 8 default categories per type. The `UNIQUE(user_id, type, name)` constraint prevents duplicates within the same type.
- `prompt_variables`
  Prompt-only variable definitions used to render the final prompt copy surface.
- `usage_logs`
  Copy activity records. `action` is constrained to `copy_raw` or `copy_final`.

Supabase Row Level Security keeps each user scoped to their own rows. Server code should continue to read and mutate data through the repository layer instead of bypassing ownership checks.

### Database RPC Functions

Three PostgreSQL functions optimize hot-path operations by reducing database round trips:

- `toggle_favorite(p_item_id, p_user_id)` — Atomic `NOT is_favorite` toggle in a single call.
- `increment_usage_count(p_item_id, p_user_id, p_action)` — Atomic `usage_count + 1` with `usage_logs` insertion in a single call.
- `get_latest_copied_at(p_item_ids)` — SQL `MAX(created_at) GROUP BY item_id` aggregation, replacing JS-side reduce.

### Database Indexes

Beyond the base migration indexes (`user_id + updated_at`, `user_id + type`, `user_id + category`, `tags` GIN):

- `items_user_favorite_updated_idx` on `(user_id, is_favorite, updated_at DESC)` — Accelerates favorite list queries.
- `items_title_trgm_idx` on `title` using `pg_trgm` GIN — Accelerates ILIKE search on the `title` column.

## DeepSeek Analyze Flow

`POST /api/items/:id/analyze` handles manual smart analyze.

1. The user saves a Prompt or Skill as raw content. The item can remain `is_analyzed=false`.
2. The detail page triggers manual smart analyze; saving content does not call the model.
3. The route verifies the Supabase session and loads the current user's item.
4. `src/server/analyze/deepseek.ts` calls DeepSeek. The model and base URL are read from environment variables (`DEEPSEEK_MODEL`, `DEEPSEEK_API_BASE_URL`) via `getServerEnv()`, which prioritizes `.env.local` over system environment variables. User content is wrapped in boundary markers to mitigate prompt injection. The prompt includes the user's custom category list (fetched from `user_categories`) so the model selects from valid categories.
5. `src/server/analyze/parser.ts` strips markdown fences, repairs common JSON issues, and validates the structured response. The `category` field is validated as a free-text string; `validateAnalysisCategory` checks it against the user's custom categories and falls back to the first category if the model returns an invalid value.
6. `src/server/analyze/service.ts` updates `items` metadata and sets `is_analyzed=true`.
7. Prompt analysis replaces that prompt's `prompt_variables`; Skill analysis ignores variable output.
8. On model or parse failure, the route returns a recoverable error and the original item content stays unchanged.

Required server-only environment variables:

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_MODEL`

Optional environment variables:

- `DEEPSEEK_API_BASE_URL`, default `https://api.deepseek.com`

All server-side environment variables are read through `getServerEnv()` (defined in `src/lib/env.ts`), which prioritizes `.env.local` file values over system `process.env`. This prevents system-level environment variables from silently overriding project-local configuration.

## GitHub Skill Import Flow

`POST /api/import/github` imports GitHub links as Skills.

1. The route accepts a JSON body with `url`.
2. `src/server/import/github.ts` only allows `github.com` and `raw.githubusercontent.com`.
3. Repository URLs are converted into raw README candidates. GitHub blob/raw README or `SKILL.md` links are converted or used directly.
4. The fetched README/SKILL.md body is used only as analysis context. README content exceeding 100KB is rejected.
5. The stored Skill uses `items.content = submitted URL` and `items.source_url = canonical repository URL`.
6. The import creates a Skill first, then requests DeepSeek analysis using the README context.
7. If analysis fails after a successful README fetch, the imported Skill remains saved with `is_analyzed=false` and the API returns a warning.

Optional server-only environment variable:

- `GITHUB_TOKEN`, used only for GitHub rate-limit relief during import.

## Copy Semantics

- `copy_raw`
  Copies `items.content` exactly as saved and logs `usage_logs.action=copy_raw`.
- `copy_final`
  Prompt-only action that fills Prompt variables, copies the rendered final prompt, and logs `usage_logs.action=copy_final`.
- GitHub-imported Skill copy
  The detail page still logs `copy_raw`, but copies `items.source_url` so linked Skills behave as source links instead of fake README bodies.
- GitHub-imported Skill detail display
  The content section heading shows "安装/加载提示词" instead of "内容", and the `<pre>` block displays "请你安装/加载这个skill：" followed by a clickable `items.source_url` link, instead of rendering the raw `items.content` URL text.

Copy logging is implemented through Server Actions. There is no `POST /api/items/:id/copy` Route Handler yet; that route name is reserved only if an external API surface is needed later.

## Verification Baseline

Phase 4 was verified on `2026-05-02` with:

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- local Supabase runtime plus real DeepSeek `deepseek-v4-flash` end-to-end analyze smoke test

Phase 5 was verified on `2026-05-02` with:

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- live README fetch check for `https://github.com/tw93/Waza`
- local Supabase + DeepSeek browser smoke: magic-link login, Waza GitHub import, analyzed Skill detail, source URL copy, Skills search, invalid GitHub URL rejection, manual Skill save/copy fallback

Production deployment verified on `2026-05-03` with:

- Supabase cloud project `robox` in `ap-northeast-1` with migration applied
- Vercel deployment at `robox.vercel.app`
- All 94 tests passing, typecheck/lint/build clean
- Full Chinese UI localization across all components
- Performance: `React.cache()` on `getServerSupabaseClient()` and `readSessionEmail()` to deduplicate Supabase calls per request

## Performance

Performance optimization was completed on `2026-05-05`.

### Perceived Speed

- `(workspace)/loading.tsx` provides a skeleton screen for all workspace pages during SSR data loading, eliminating blank-page waits.
- Detail and edit pages wrap their data-fetching content components in `<Suspense>`, so the page shell (sidebar, header) renders immediately while content streams in.

### Server-Side Efficiency

- `getDashboardSnapshot()` uses 6 parallel queries with `limit` instead of loading all items into Node memory.
- `toggleFavorite` and `recordCopyAction` use PostgreSQL RPC functions for single-trip atomic operations instead of read-then-write patterns.
- `selectLatestCopiedAtByItemId` uses SQL aggregation via RPC instead of fetching all `usage_logs` rows and reducing in JS.

### Client-Side Rendering

- `ItemCard`, `VariableCard`, `MetricCard`, and `MiniListCard` are wrapped with `React.memo` to prevent unnecessary re-renders after actions like favoriting.
- `formatDate` is extracted to `src/lib/format.ts` as a shared utility.
- `BatchAnalyzeButton` runs 3 concurrent requests and calls `router.refresh()` once after all complete, instead of refreshing after each success.
- `LibraryFilters` uses `useRouter` + `useSearchParams` for client-side navigation instead of full-page form submission.

### Caching

- `/_next/static/` responses include `Cache-Control: public, max-age=31536000, immutable`.
- API route responses (`/api/items/:id/analyze`, `/api/import/github`) include `Cache-Control: no-store`.

## Security Layer

Security hardening was completed on `2026-05-04`.

### Authentication

RoBox supports two login methods:

- **GitHub OAuth** (primary): `GET /auth/github` initiates the OAuth flow via `supabase.auth.signInWithOAuth({ provider: "github" })` with PKCE. The callback is handled by Supabase Auth at `/auth/v1/callback`, which redirects to `/auth/confirm` with the session. The `redirectTo` parameter is constructed from the request origin, so local dev redirects to `localhost:3000/auth/confirm` and production redirects to `robox-beta.vercel.app/auth/confirm`. Cloud Supabase's `site_url` and `uri_allow_list` must include the production domain; otherwise GoTrue falls back to `site_url` (which was `localhost:3000` before the fix).
- **Magic Link** (fallback): Email-based passwordless login through `requestMagicLinkAction`. The email allowlist (`ALLOWED_EMAILS`) is enforced for both methods.

Both API Route Handlers (`/api/items/:id/analyze` and `/api/import/github`) enforce explicit authentication via `getOptionalAppUser()`. Unauthenticated requests receive `401 Unauthorized`.

### Rate Limiting

`src/lib/rate-limit.ts` implements an in-memory IP-based sliding-window rate limiter. A `cleanup()` function runs every 60 seconds to remove expired entries, preventing unbounded memory growth in long-running serverless function instances (Fluid Compute).

- `/api/import/github`: 10 requests per IP per hour
- `/api/items/:id/analyze`: 30 requests per IP per hour

Exceeding the limit returns `429 Too Many Requests`.

### Security Headers

`next.config.ts` applies the following headers to all responses:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy` (scoped to self, Supabase, DeepSeek, and GitHub)
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Input Validation

- Search queries: `sanitizeSearchValue` escapes PostgreSQL ILIKE wildcards (`%`, `_`).
- GitHub import: URL length capped at 2048 characters; request body capped at 4KB.
- README fetch: content exceeding 100KB is rejected.
- DeepSeek prompt: user content is wrapped in boundary markers with an instruction to ignore injection attempts.

### CORS

API Route Handlers reject cross-origin requests. Only same-origin requests are allowed.

### Error Handling

Production API responses use generic error messages. Detailed error information (including third-party API errors) is only exposed in development mode.

### Ownership Checks

`replacePromptVariables` now verifies item existence and ownership before deleting variables, adding defense-in-depth beyond RLS.

## Custom Categories

Categories are no longer a fixed enum. Each user manages their own Prompt and Skill categories independently through the `user_categories` table.

- New users are seeded with 8 default categories (Writing, Coding, Research, Design, Study, Agent, Content, Other) per type.
- The Settings page provides a Category Manager with Prompt/Skill tabs for adding, deleting, and reordering categories.
- Deleting a category that has items in use requires selecting a replacement category; those items are migrated before the category is removed.
- The last category in a type cannot be deleted.
- `items.category` stores free-text values. Application-layer validation (via `validateCategoryBelongsToUser`) ensures the value exists in the user's `user_categories` for the corresponding type.
- DeepSeek analysis dynamically injects the user's category list into the prompt and validates the returned category against it, falling back to the first category if invalid.

