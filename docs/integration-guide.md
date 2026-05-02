# RoBox Integration Guide

This guide is for running RoBox locally and smoke-testing the implemented Phase 4 surfaces.

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

Required key for live smart analyze:

```text
DEEPSEEK_API_KEY=
```

Optional DeepSeek keys:

```text
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_API_BASE_URL=https://api.deepseek.com
```

The repository default model is `deepseek-v4-flash`. The current DeepSeek API rejected `deepseek-v4` during `2026-05-02` verification; use `deepseek-v4-flash` or another accepted DeepSeek model name.

## Implemented Route Handlers

### Analyze Item

```text
POST /api/items/:id/analyze
```

Requirements:

- A valid Supabase session cookie.
- The item must belong to the logged-in user.
- No request body is required.

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

## Manual Smoke Test

1. Start Supabase and the Next.js dev server.
2. Open `/login` and sign in with an email listed in `ALLOWED_EMAILS`.
3. Create a Prompt with raw content that includes variables such as `{{topic}}`, `{{format}}`, and `{{audience}}`.
4. Open the Prompt detail page and click smart analyze.
5. Confirm title, summary, category, tags, and Prompt variables are populated.
6. Confirm the original raw content is unchanged.
7. Fill variables and use final prompt copy.
8. Use raw copy and confirm it still copies the original content.

## Phase 5 Boundary

GitHub Skill import is not implemented in Phase 4. `GITHUB_TOKEN` remains an optional future integration variable for Phase 5.

