# RoBox Phase 2 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authenticated single-user access, the Phase 2 Supabase schema, and reusable server-side auth/data boundaries without prematurely wiring the full Phase 3 library UX.

**Architecture:** Keep the existing App Router shell, add a Supabase cookie-auth login flow around it, and enforce the single-user boundary in both the Next.js auth guard and database RLS. Put runtime validation in `src/lib/schema`, session and allowlist logic in `src/server/auth`, and persistence logic in `src/server/db`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase SSR/Auth/Postgres, SQL migrations, Vitest, Zod

---

### Task 1: Add validation and unit-test foundation

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`
- Create: `src/lib/schema/items.ts`
- Create: `src/lib/schema/items.test.ts`
- Create: `src/server/auth/allowlist.ts`
- Create: `src/server/auth/allowlist.test.ts`

- [ ] **Step 1: Write the failing schema tests**

```ts
import { describe, expect, it } from "vitest";

import {
  copyActionSchema,
  createItemInputSchema,
  itemCategorySchema,
} from "./items";

describe("item schemas", () => {
  it("accepts only phase 2 categories", () => {
    expect(itemCategorySchema.parse("Coding")).toBe("Coding");
    expect(() => itemCategorySchema.parse("Workflow")).toThrow();
  });

  it("requires raw content when creating an item", () => {
    expect(() =>
      createItemInputSchema.parse({ type: "prompt", content: "" }),
    ).toThrow();
  });

  it("accepts only supported copy actions", () => {
    expect(copyActionSchema.parse("copy_raw")).toBe("copy_raw");
    expect(() => copyActionSchema.parse("copy_preview")).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/lib/schema/items.test.ts`
Expected: FAIL because `vitest`, schemas, and test script do not exist yet.

- [ ] **Step 3: Write the failing allowlist tests**

```ts
import { describe, expect, it } from "vitest";

import {
  isEmailAllowed,
  parseAllowedEmails,
} from "@/server/auth/allowlist";

describe("allowlist", () => {
  it("normalizes whitespace and casing", () => {
    expect(parseAllowedEmails(" Robert@Example.com , foo@bar.com ")).toEqual([
      "robert@example.com",
      "foo@bar.com",
    ]);
  });

  it("matches emails case-insensitively", () => {
    expect(isEmailAllowed("Robert@Example.com", ["robert@example.com"])).toBe(
      true,
    );
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm run test -- src/server/auth/allowlist.test.ts`
Expected: FAIL because allowlist helpers do not exist yet.

- [ ] **Step 5: Implement the minimal test foundation**

```ts
// package.json
{
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^3.2.4",
    "zod": "^3.25.76"
  }
}
```

```ts
// vitest.config.ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

```ts
// src/server/auth/allowlist.ts
export function parseAllowedEmails(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string, allowlist: string[]) {
  return allowlist.includes(email.trim().toLowerCase());
}
```

- [ ] **Step 6: Implement the shared item schemas**

```ts
import { z } from "zod";

export const itemCategorySchema = z.enum([
  "Writing",
  "Coding",
  "Research",
  "Design",
  "Study",
  "Agent",
  "Content",
  "Other",
]);

export const createItemInputSchema = z.object({
  type: z.enum(["prompt", "skill"]),
  title: z.string().trim().max(120).optional(),
  summary: z.string().trim().max(240).optional(),
  content: z.string().trim().min(1),
  category: itemCategorySchema.default("Other"),
  tags: z.array(z.string().trim().min(1)).max(12).default([]),
  sourceUrl: z.string().trim().url().optional().or(z.literal("")),
});

export const copyActionSchema = z.enum(["copy_raw", "copy_final"]);
```

- [ ] **Step 7: Run focused tests**

Run: `npm run test -- src/lib/schema/items.test.ts src/server/auth/allowlist.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/schema/items.ts src/lib/schema/items.test.ts src/server/auth/allowlist.ts src/server/auth/allowlist.test.ts
git commit -m "test: add phase 2 schema and allowlist tests"
```

### Task 2: Create the Supabase schema and RLS

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/202605010001_phase2_foundation.sql`
- Create: `src/server/db/types.ts`
- Create: `src/server/db/mappers.ts`
- Create: `src/server/db/mappers.test.ts`

- [ ] **Step 1: Write the failing mapper tests**

```ts
import { describe, expect, it } from "vitest";

import { mapItemRow, mapPromptVariableRow } from "./mappers";

describe("database mappers", () => {
  it("maps snake_case item rows to app shape", () => {
    const item = mapItemRow({
      id: "item-1",
      user_id: "user-1",
      type: "prompt",
      title: "Prompt A",
      summary: "Summary",
      content: "raw",
      category: "Coding",
      tags: ["ts"],
      source_url: null,
      is_favorite: true,
      is_analyzed: false,
      usage_count: 3,
      created_at: "2026-05-01T00:00:00.000Z",
      updated_at: "2026-05-01T00:00:00.000Z",
    });

    expect(item.isFavorite).toBe(true);
    expect(item.isAnalyzed).toBe(false);
  });

  it("maps prompt variable rows to camelCase", () => {
    expect(
      mapPromptVariableRow({
        id: "var-1",
        item_id: "item-1",
        name: "topic",
        description: "desc",
        default_value: "ts",
        required: true,
        sort_order: 1,
        created_at: "2026-05-01T00:00:00.000Z",
      }).defaultValue,
    ).toBe("ts");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/server/db/mappers.test.ts`
Expected: FAIL because mapper modules do not exist yet.

- [ ] **Step 3: Initialize Supabase locally in-repo**

Run: `npm run supabase:init`
Expected: a `supabase/` directory with `config.toml`

- [ ] **Step 4: Write the migration**

```sql
create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('prompt', 'skill')),
  title text not null default '',
  summary text not null default '',
  content text not null,
  category text not null default 'Other'
    check (category in ('Writing','Coding','Research','Design','Study','Agent','Content','Other')),
  tags text[] not null default '{}',
  source_url text,
  is_favorite boolean not null default false,
  is_analyzed boolean not null default false,
  usage_count integer not null default 0 check (usage_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.items enable row level security;

create policy "items_select_own" on public.items
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
```

- [ ] **Step 5: Finish related tables, triggers, indexes, and policies**

```sql
create table public.prompt_variables (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  name text not null,
  description text not null default '',
  default_value text not null default '',
  required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  action text not null check (action in ('copy_raw', 'copy_final')),
  created_at timestamptz not null default timezone('utc', now())
);
```

- [ ] **Step 6: Implement database row types and mappers**

```ts
export interface ItemRow {
  id: string;
  user_id: string;
  type: "prompt" | "skill";
  title: string;
  summary: string;
  content: string;
  category: ItemCategory;
  tags: string[];
  source_url: string | null;
  is_favorite: boolean;
  is_analyzed: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}
```

```ts
export function mapItemRow(row: ItemRow) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    summary: row.summary,
    content: row.content,
    category: row.category,
    tags: row.tags,
    sourceUrl: row.source_url ?? "",
    isFavorite: row.is_favorite,
    isAnalyzed: row.is_analyzed,
    usageCount: row.usage_count,
    updatedAt: row.updated_at,
  };
}
```

- [ ] **Step 7: Run focused tests**

Run: `npm run test -- src/server/db/mappers.test.ts`
Expected: PASS

- [ ] **Step 8: Verify migration syntax as far as local tooling allows**

Run: `npm run supabase:version`
Expected: exits 0

Run: `docker version`
Expected: if Docker is unavailable, record that local database reset/start could not be executed in this environment.

- [ ] **Step 9: Commit**

```bash
git add supabase src/server/db/types.ts src/server/db/mappers.ts src/server/db/mappers.test.ts
git commit -m "feat: add phase 2 database schema and row mappers"
```

### Task 3: Add authenticated routing and login flow

**Files:**
- Modify: `src/lib/env.ts`
- Create: `src/lib/supabase/proxy.ts`
- Create: `proxy.ts`
- Create: `src/server/auth/session.ts`
- Create: `src/server/auth/service.ts`
- Create: `src/server/auth/service.test.ts`
- Create: `src/app/login/page.tsx`
- Create: `src/app/login/actions.ts`
- Create: `src/app/auth/confirm/route.ts`
- Modify: `src/app/(workspace)/layout.tsx`
- Modify: `src/components/layout/workspace-shell.tsx`

- [ ] **Step 1: Write the failing auth service tests**

```ts
import { describe, expect, it } from "vitest";

import { buildAuthRedirectUrl } from "@/server/auth/service";

describe("auth service", () => {
  it("builds the confirm callback URL off the current origin", () => {
    expect(buildAuthRedirectUrl("http://localhost:3000")).toBe(
      "http://localhost:3000/auth/confirm?next=%2Fdashboard",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/server/auth/service.test.ts`
Expected: FAIL because auth service helpers do not exist yet.

- [ ] **Step 3: Implement the Supabase proxy and session guard**

```ts
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  await supabase.auth.getClaims();
  return response;
}
```

- [ ] **Step 4: Implement allowlist-aware login/logout service**

```ts
export function buildAuthRedirectUrl(origin: string) {
  return `${origin}/auth/confirm?next=%2Fdashboard`;
}
```

```ts
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: buildAuthRedirectUrl(origin),
    shouldCreateUser: true,
  },
});
```

- [ ] **Step 5: Implement the login route and confirmation route**

```ts
// /auth/confirm
const { error } = await supabase.auth.verifyOtp({
  type,
  token_hash,
});
```

```tsx
// /login
<form action={requestMagicLinkAction} className="space-y-4">
  <Input name="email" type="email" required />
  <Button type="submit">Send magic link</Button>
</form>
```

- [ ] **Step 6: Protect the workspace layout**

```ts
const user = await requireAppUser("/dashboard");
return <WorkspaceShell userEmail={user.email}>{children}</WorkspaceShell>;
```

- [ ] **Step 7: Run focused tests**

Run: `npm run test -- src/server/auth/allowlist.test.ts src/server/auth/service.test.ts`
Expected: PASS

- [ ] **Step 8: Run app verification**

Run: `npm run build`
Expected: PASS with `/login` and `/auth/confirm` included

- [ ] **Step 9: Commit**

```bash
git add src/lib/env.ts src/lib/supabase/proxy.ts proxy.ts src/server/auth src/app/login src/app/auth src/app/'(workspace)'/layout.tsx src/components/layout/workspace-shell.tsx
git commit -m "feat: add phase 2 auth guard and login flow"
```

### Task 4: Add the server-side item repository

**Files:**
- Create: `src/server/db/items.ts`
- Create: `src/server/db/items.test.ts`
- Modify: `src/features/items/types.ts`

- [ ] **Step 1: Write the failing repository helper tests**

```ts
import { describe, expect, it } from "vitest";

import {
  buildItemInsert,
  buildItemUpdate,
  sanitizeListItemsInput,
} from "@/server/db/items";

describe("items repository helpers", () => {
  it("defaults missing category to Other", () => {
    expect(
      buildItemInsert("user-1", { type: "prompt", content: "raw", tags: [] })
        .category,
    ).toBe("Other");
  });

  it("does not send undefined fields in updates", () => {
    expect(buildItemUpdate({ title: "New title", summary: undefined })).toEqual({
      title: "New title",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/server/db/items.test.ts`
Expected: FAIL because repository helpers do not exist yet.

- [ ] **Step 3: Implement pure helper functions first**

```ts
export function buildItemInsert(userId: string, input: CreateItemInput) {
  return {
    user_id: userId,
    type: input.type,
    title: input.title ?? "",
    summary: input.summary ?? "",
    content: input.content,
    category: input.category ?? "Other",
    tags: input.tags ?? [],
    source_url: input.sourceUrl || null,
  };
}
```

- [ ] **Step 4: Implement Supabase-backed repository functions**

```ts
export async function createItem(input: CreateItemInput) {
  const { supabase, userId } = await requireDatabaseContext();
  const payload = buildItemInsert(userId, createItemInputSchema.parse(input));
  const { data, error } = await supabase
    .from("items")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return mapItemRow(data);
}
```

```ts
export async function recordCopyAction(itemId: string, action: CopyAction) {
  const { supabase } = await requireDatabaseContext();
  await supabase.from("usage_logs").insert({ item_id: itemId, action });
  await supabase.rpc("increment_item_usage_count", { target_item_id: itemId });
}
```

- [ ] **Step 5: Run focused tests**

Run: `npm run test -- src/server/db/items.test.ts src/server/db/mappers.test.ts`
Expected: PASS

- [ ] **Step 6: Run full repo verification**

Run: `npm run test`
Expected: PASS

Run: `npm run lint`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/server/db/items.ts src/server/db/items.test.ts src/features/items/types.ts
git commit -m "feat: add phase 2 item repository"
```

### Task 5: Update docs and phase status

**Files:**
- Modify: `README.md`
- Modify: `docs/setup.md`
- Modify: `PLAN.md`

- [ ] **Step 1: Update docs to reflect the new auth/database baseline**

```md
- `/login` now uses Supabase email magic link auth.
- `ALLOWED_EMAILS` is required in Phase 2.
- `supabase/migrations/...phase2_foundation.sql` creates `items`, `prompt_variables`, and `usage_logs`.
```

- [ ] **Step 2: Add local setup notes for auth callback**

```md
Update the Supabase email template to:
`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
```

- [ ] **Step 3: Run final verification**

Run: `npm run test`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add README.md docs/setup.md PLAN.md
git commit -m "docs: document phase 2 auth and database setup"
```
