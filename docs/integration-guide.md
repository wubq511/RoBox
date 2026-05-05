# RoBox Integration Guide

This guide is for running RoBox locally and smoke-testing the implemented MVP surfaces.

## Local Setup

Install dependencies and start the app:

```bash
npm ci
npm run dev
```

The default login URL is:

```text
http://localhost:3000/login
```

Start the local Supabase runtime when you need Auth and persistent data:

```bash
npm run supabase:install
npm run supabase:start
npm run supabase:status
```

Use the values printed by `npm run supabase:status` to fill `.env.local`. Do not commit `.env.local`.

Required local keys for the main app:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
ALLOWED_EMAILS=
```

Required key for live smart analyze and GitHub import analysis:

```text
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-v4-flash
```

Optional DeepSeek base URL:

```text
DEEPSEEK_API_BASE_URL=https://api.deepseek.com
```

The repository uses `deepseek-v4-flash` as the default model.

All server-side environment variables are read through `getServerEnv()` (`src/lib/env.ts`), which prioritizes `.env.local` over system `process.env`.

Optional GitHub key:

```text
GITHUB_TOKEN=
```

`GITHUB_TOKEN` is server-only and used only for GitHub import rate-limit relief.

## Implemented Route Handlers

### Analyze Item

```text
POST /api/items/:id/analyze
```

Requirements:

- A valid Supabase session cookie (enforced by `getOptionalAppUser()`; returns `401` if missing).
- The item must belong to the logged-in user.
- No request body is required.
- Rate limit: 30 requests per IP per hour. Returns `429` when exceeded.
- Same-origin only; cross-origin requests return `403`.

Client-side usage from an authenticated app page:

```ts
await fetch(`/api/items/${itemId}/analyze`, { method: "POST" });
```

Successful response shape:

```ts
{
  item: Item;
}
```

Failure response shape:

```ts
{
  error: string;
}
```

Do not use an unauthenticated `curl` command for this route; the route depends on the browser session and Supabase ownership checks.

### Import GitHub Skill

```text
POST /api/import/github
```

Requirements:

- A valid Supabase session cookie (enforced by `getOptionalAppUser()`; returns `401` if missing).
- Same-origin only; cross-origin requests return `403`.
- Rate limit: 10 requests per IP per hour. Returns `429` when exceeded.
- Request body must not exceed 4KB. URL must not exceed 2048 characters.

Request body:

```ts
{
  url: "https://github.com/tw93/Waza";
}
```

Supported URL forms:

- `https://github.com/<owner>/<repo>`
- `https://github.com/<owner>/<repo>/blob/<branch>/README.md`
- `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/README.md`
- `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/SKILL.md`

Successful response shape:

```ts
{
  item: Item;
  readmeUrl: string;
  warning?: string;
}
```

Import stores the submitted link in `items.content`, stores the canonical repository link in `items.source_url`, and uses fetched README/SKILL.md content only as DeepSeek analysis context.

### List Categories

```text
GET /api/categories?type=<prompt|skill>
```

Requirements:

- A valid Supabase session cookie (enforced by `getOptionalAppUser()`; returns `401` if missing).
- Same-origin only; cross-origin requests return `403`.
- The `type` query parameter is required and must be `prompt` or `skill`.

Client-side usage from an authenticated app page:

```ts
const res = await fetch("/api/categories?type=prompt");
const data = await res.json();
// data.categories: Array<{ id, userId, type, name, sortOrder, createdAt }>
```

If the user has no categories yet, the endpoint seeds 8 default categories automatically.

### Add Category

```text
POST /api/categories
```

Requirements:

- A valid Supabase session cookie (enforced by `getOptionalAppUser()`; returns `401` if missing).
- Same-origin only; cross-origin requests return `403`.

Request body:

```ts
{
  type: "prompt" | "skill",
  name: "My Category"
}
```

Category names must be 1-32 characters. Duplicate names within the same type return `409`.

### Delete Category

```text
DELETE /api/categories/<name>?type=<prompt|skill>
```

Requirements:

- A valid Supabase session cookie (enforced by `getOptionalAppUser()`; returns `401` if missing).
- Same-origin only; cross-origin requests return `403`.
- The `type` query parameter is required.
- The last category in a type cannot be deleted (`400`).

If the category has items in use, the response returns `409` with `{ error, usageCount, requiresReplacement: true }`. To force-delete, re-send the request with header `x-replacement-category: <name>` specifying which category to migrate items to.

### Reorder Categories

```text
PATCH /api/categories/reorder
```

Requirements:

- A valid Supabase session cookie (enforced by `getOptionalAppUser()`; returns `401` if missing).
- Same-origin only; cross-origin requests return `403`.

Request body:

```ts
{
  type: "prompt" | "skill",
  orderedNames: ["Writing", "Coding", "Other"]
}
```

## Manual Smoke Test

1. Start Supabase and the Next.js dev server.
2. Open `/login` and sign in with an email listed in `ALLOWED_EMAILS`.
3. Create a Prompt with raw content that includes variables such as `{{topic}}`, `{{format}}`, and `{{audience}}`.
4. Open the Prompt detail page and click smart analyze.
5. Confirm title, summary, category, tags, and Prompt variables are populated.
6. Confirm the original raw content is unchanged.
7. Fill variables and use final prompt copy.
8. Use raw copy and confirm it still copies the original content.
9. Open `/skills/new`, import `https://github.com/tw93/Waza`, and confirm the saved Skill detail page opens.
10. Confirm imported GitHub Skill copy uses the source URL, while manually pasted Skills still copy their raw content.

