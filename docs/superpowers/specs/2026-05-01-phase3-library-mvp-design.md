# Phase 3 Library MVP Design

> Status: Implemented on `2026-05-02`. This document is retained as the Phase 3 scope/design record; current operating instructions live in `D:\RoBox\README.md` and `D:\RoBox\docs\setup.md`.

## 1. Context

This document defines the Phase 3 implementation scope for RoBox.

Reference priority:

1. `D:\RoBox\PLAN.md`
2. `D:\RoBox\RoBox 最终项目方案.md`
3. `D:\RoBox\RoBox_UI_Prototype\`
4. `D:\RoBox\AGENTS.md`

Phase 3 must implement the real library MVP loop:

`save -> search -> open -> edit -> copy`

This phase replaces static mock-driven workspace pages with real Supabase-backed library flows.

## 2. Scope

### In scope

- Real Dashboard data for:
  - global search entry
  - recently used items
  - favorite items
  - pending analyze items
  - item count statistics
  - quick add entry
- Real Prompt pages:
  - list
  - create
  - detail
  - edit
- Real Skill pages:
  - list
  - create
  - detail
  - edit
- Real library actions:
  - search
  - filter
  - sort
  - favorite toggle
  - delete
  - copy raw content
  - usage log write
- Prompt variable definition editing:
  - variables are optional
  - prompts with no variables must still save successfully
- Basic UX states:
  - empty state
  - no results state
  - save failure state
  - copy feedback state

### Out of scope

- DeepSeek analyze execution
- Prompt final text generation
- `copy_final`
- GitHub Skill import
- schema migrations
- semantic search
- batch import

## 3. Conflict Resolution

There is a stage conflict between the two product documents:

- `D:\RoBox\RoBox 最终项目方案.md` describes the end-state Prompt flow, including variable filling, final prompt preview, `copy_final`, and DeepSeek-assisted organization.
- `D:\RoBox\PLAN.md` assigns DeepSeek analyze, Prompt variable fill flow, and `copy_final` to Phase 4.

Phase 3 follows `PLAN.md`.

Therefore Prompt behavior in this phase is limited to:

- editing variable definitions manually
- allowing zero variables
- displaying saved variable definitions
- copying raw Prompt content only

## 4. Product Behavior

### 4.1 Dashboard

Dashboard must display real data and act as a fast workspace entry.

Required sections:

- search entry
- recently used items
- favorite items
- pending analyze items
- item counts
- quick add

The existing shared workspace topbar search is the global search entry for Phase 3. Dashboard must visually support that entry point through layout and quick navigation, but it does not introduce a second independent search system.

### 4.2 Prompt library

Prompt list page must support:

- keyword search across title, summary, and content
- category filter
- tag filter
- favorite filter
- sort by recently used
- sort by recently updated

The route itself provides the type scope. `/prompts` is already the Prompt-only view, so Phase 3 does not add a redundant type toggle inside that page.

Prompt create and edit pages must support:

- title
- summary
- category
- tags
- content
- variable definitions

Prompt detail page must support:

- metadata display
- variable definition display
- copy raw Prompt
- favorite toggle
- edit
- delete

### 4.3 Skill library

Skill list page must support:

- keyword search across title, summary, and content
- category filter
- tag filter
- favorite filter
- sort by recently used
- sort by recently updated

The route itself provides the type scope. `/skills` is already the Skill-only view, so Phase 3 does not add a redundant type toggle inside that page.

Skill create and edit pages must support:

- title
- summary
- category
- tags
- content

Skill detail page must support:

- metadata display
- raw content display
- copy raw Skill
- favorite toggle
- edit
- delete

GitHub import entry is not implemented in this phase.

Any existing shell-level GitHub import affordance must remain non-operational or be replaced with a non-import action until Phase 5 lands.

### 4.4 Delete behavior

Delete is part of Phase 3 product behavior, but it must remain an explicit user action in the UI.

Implementation requirement:

- detail and list actions can expose delete
- destructive submission must require explicit in-product confirmation
- the application must not auto-delete records as part of any background flow

## 5. Technical Design

### 5.1 Routing

Phase 3 introduces route-backed pages instead of mock-only single-page panels.

Required routes:

- `src/app/(workspace)/dashboard/page.tsx`
- `src/app/(workspace)/prompts/page.tsx`
- `src/app/(workspace)/prompts/new/page.tsx`
- `src/app/(workspace)/prompts/[id]/page.tsx`
- `src/app/(workspace)/prompts/[id]/edit/page.tsx`
- `src/app/(workspace)/skills/page.tsx`
- `src/app/(workspace)/skills/new/page.tsx`
- `src/app/(workspace)/skills/[id]/page.tsx`
- `src/app/(workspace)/skills/[id]/edit/page.tsx`

### 5.2 Rendering model

Server Components fetch first-load data for list and detail pages.

Server Actions handle mutations:

- create
- update
- delete
- toggle favorite
- record copy

This keeps auth and data writes inside existing server boundaries and avoids introducing a new REST layer for Phase 3.

### 5.3 Repository boundary

`src/server/db/items.ts` remains the single repository entry for item and variable persistence.

It must be extended to support:

- tag filtering
- explicit sort selection
- dashboard aggregation queries
- item deletion

Pages and components must not build Supabase queries directly.

### 5.4 Schema boundary

`src/lib/schema/items.ts` remains the shared validation boundary.

It must be extended for:

- list sort parameters
- tag filter input
- prompt variable form input

Existing enums remain unchanged:

- `type`: `prompt | skill`
- `category`: `Writing | Coding | Research | Design | Study | Agent | Content | Other`
- `action`: `copy_raw | copy_final`

Even though `copy_final` is not used in Phase 3 UI, the existing enum stays unchanged because it is already part of the forward product contract.

## 6. Component Decomposition

The current `src/components/library/library-view.tsx` mixes mock list rendering and placeholder detail behavior. Phase 3 should split it by responsibility.

Target component groups:

- `src/components/dashboard/*`
  - real dashboard metrics and entry cards
- `src/components/library/*`
  - list header and controls
  - filter controls
  - list rows or cards
  - detail view
  - shared item form
  - prompt variable editor
  - copy feedback UI
  - delete confirmation UI

Prompt and Skill should share the same library shell where behavior matches. Variable editing and Prompt-only detail sections stay isolated to Prompt-specific components.

## 7. Data Flow

### 7.1 List flow

1. Read URL search params.
2. Parse params through shared schema.
3. Fetch matching items from the repository.
4. Render the list with the active filter state preserved in the UI.

### 7.2 Create flow

1. User submits create form.
2. Server Action validates input through schema.
3. Repository creates the item.
4. If item type is Prompt, variable definitions are saved through the prompt variable repository path.
5. On success, redirect to the created item detail page.
6. On failure, keep submitted values and surface an inline error.

### 7.3 Edit flow

1. Detail page links to edit route.
2. Edit page loads current item data.
3. User submits updated values.
4. Server Action validates and persists changes.
5. Prompt variable definitions are replaced only for Prompt items.
6. On success, redirect back to detail.
7. On failure, keep submitted values and surface an inline error.

### 7.4 Copy flow

1. User triggers raw copy from list or detail.
2. UI copies the raw item content.
3. Server Action records `copy_raw`.
4. Repository inserts a `usage_logs` row and increments `usage_count`.
5. UI shows success or failure feedback.

Phase 3 requires `usage_logs` and `usage_count` to stay behaviorally consistent.

### 7.5 Favorite flow

1. User toggles favorite from list or detail.
2. Server Action flips `is_favorite`.
3. Page refreshes or revalidates current data.

### 7.6 Delete flow

1. User clicks delete.
2. UI shows confirmation.
3. Confirmed submission calls the delete Server Action.
4. Repository deletes the item and any Prompt variables tied to it.
5. UI redirects to the relevant list page and shows feedback.

## 8. UX Rules

The UI must follow the already-approved prototype direction, but use real route-backed pages instead of prototype-only in-page state.

Required behavior:

- list empty state must guide the user to create a Prompt or Skill
- no-results state must suggest adjusting keyword or filters
- save failure must not clear form input
- copy failure must be visible and must not claim success
- raw content must remain intact and must never be overwritten by later AI organization work

## 9. Testing Strategy

Phase 3 uses TDD for behavior changes, starting from repository and action boundaries before wiring UI.

### 9.1 Automated tests

Add or extend tests for:

- schema parsing for list filters and variable input
- repository filtering
- repository sorting
- tag filtering
- delete behavior
- copy behavior
- favorite toggle behavior
- Prompt variable replacement with zero variables allowed
- Server Actions for create, update, delete, favorite, and copy

### 9.2 Verification commands

Required project verification after implementation:

- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### 9.3 Non-goals for this phase

This phase does not add a new browser automation or component-test stack. UI correctness is validated through the application build plus the existing project verification commands.

## 10. Delivery Order

Implementation order:

1. Prompt repository and schema extensions
2. Prompt actions
3. Prompt pages
4. Skill pages by reusing shared library pieces
5. Dashboard aggregation
6. Full verification pass

This order minimizes rework because Prompt carries the most Phase 3 behavior, Skill is a simpler sibling flow, and Dashboard depends on the final library data shape.
