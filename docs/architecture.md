# RoBox Architecture

RoBox is a personal Prompt / Skill manager. The product boundary is intentionally small: save, organize, search, and copy reusable `prompt` and `skill` content.

## System Boundaries

- `prompt` and `skill` are the only supported item types.
- The original user input is stored in `items.content` and must not be overwritten by model output.
- AI analysis enriches metadata and variables; it does not replace the source text.
- Copy behavior is split between raw copy and final prompt copy so usage logs stay explicit.

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

`POST /api/items/:id/analyze` is the only implemented Route Handler for Phase 4.

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

## Copy Semantics

- `copy_raw`
  Copies `items.content` exactly as saved and logs `usage_logs.action=copy_raw`.
- `copy_final`
  Prompt-only action that fills Prompt variables, copies the rendered final prompt, and logs `usage_logs.action=copy_final`.

Copy logging is implemented through Server Actions in Phase 4. There is no `POST /api/items/:id/copy` Route Handler yet; that route name is reserved only if an external API surface is needed later.

## Verification Baseline

Phase 4 was verified on `2026-05-02` with:

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- local Supabase runtime plus real DeepSeek `deepseek-v4-flash` end-to-end analyze smoke test

