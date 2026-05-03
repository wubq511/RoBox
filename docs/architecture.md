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
- `src/features/items`
  Item query-state parsing and Prompt / Skill feature types.
- `src/lib`
  Environment readers, schemas, navigation helpers, Supabase client factories, and generic utilities.
- `src/server/auth`
  Supabase Auth allowlist checks and session guards.
- `src/server/db`
  Supabase repository functions for `items`, `prompt_variables`, and `usage_logs`.
- `src/server/items`
  Form parsing and Server Actions for create, update, delete, favorite, and copy logging.
- `src/server/analyze`
  DeepSeek prompt construction, model call, JSON repair/parsing, and persistence orchestration.
- `src/server/import`
  GitHub URL validation, raw README/SKILL.md fetch, Skill creation, and README-based analysis orchestration.
- `src/proxy`
  Next.js middleware entry point using `src/lib/supabase/proxy.ts` for Supabase session refresh on every matched request.

## Data Model

The MVP data model is centered on three Supabase tables:

- `items`
  The unified Prompt / Skill entity. Important fields include `type`, `title`, `summary`, `content`, `category`, `tags`, `source_url`, `is_favorite`, `is_analyzed`, and `usage_count`.
- `prompt_variables`
  Prompt-only variable definitions used to render the final prompt copy surface.
- `usage_logs`
  Copy activity records. `action` is constrained to `copy_raw` or `copy_final`.

Supabase Row Level Security keeps each user scoped to their own rows. Server code should continue to read and mutate data through the repository layer instead of bypassing ownership checks.

## DeepSeek Analyze Flow

`POST /api/items/:id/analyze` handles manual smart analyze.

1. The user saves a Prompt or Skill as raw content. The item can remain `is_analyzed=false`.
2. The detail page triggers manual smart analyze; saving content does not call the model.
3. The route verifies the Supabase session and loads the current user's item.
4. `src/server/analyze/deepseek.ts` calls DeepSeek. The default model is `deepseek-v4-flash`.
5. `src/server/analyze/parser.ts` strips markdown fences, repairs common JSON issues, and validates the structured response.
6. `src/server/analyze/service.ts` updates `items` metadata and sets `is_analyzed=true`.
7. Prompt analysis replaces that prompt's `prompt_variables`; Skill analysis ignores variable output.
8. On model or parse failure, the route returns a recoverable error and the original item content stays unchanged.

Required server-only environment variable:

- `DEEPSEEK_API_KEY`

Optional environment variables:

- `DEEPSEEK_MODEL`, default `deepseek-v4-flash`
- `DEEPSEEK_API_BASE_URL`, default `https://api.deepseek.com`

## GitHub Skill Import Flow

`POST /api/import/github` imports GitHub links as Skills.

1. The route accepts a JSON body with `url`.
2. `src/server/import/github.ts` only allows `github.com` and `raw.githubusercontent.com`.
3. Repository URLs are converted into raw README candidates. GitHub blob/raw README or `SKILL.md` links are converted or used directly.
4. The fetched README/SKILL.md body is used only as analysis context.
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

