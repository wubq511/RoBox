import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildItemInsert,
  buildItemUpdate,
  deleteItem,
  getDashboardSnapshot,
  listItems,
  sanitizeListItemsInput,
  sortItemsByRecentUsage,
} from "./items";

const { requireAppUserMock, getServerSupabaseClientMock } = vi.hoisted(() => ({
  requireAppUserMock: vi.fn(),
  getServerSupabaseClientMock: vi.fn(),
}));

vi.mock("@/server/auth/session", () => ({
  requireAppUser: requireAppUserMock,
}));

vi.mock("@/lib/supabase/server-client", () => ({
  getServerSupabaseClient: getServerSupabaseClientMock,
}));

type MockItemRow = {
  id: string;
  user_id: string;
  type: "prompt" | "skill" | "tool";
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  source_url: string | null;
  is_favorite: boolean;
  is_analyzed: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
};

function createItemRow(
  overrides: Partial<MockItemRow> & Pick<MockItemRow, "id">,
): MockItemRow {
  return {
    user_id: "user-1",
    type: "prompt",
    title: "Item",
    summary: "",
    content: "raw",
    category: "Coding",
    tags: [],
    source_url: null,
    is_favorite: false,
    is_analyzed: true,
    usage_count: 0,
    created_at: "2026-05-01T00:00:00.000Z",
    updated_at: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

function createSupabaseMock({
  items,
}: {
  items: MockItemRow[];
}) {
  const state = {
    items: [...items],
    containsCalls: [] as Array<{ column: string; value: unknown }>,
    orCalls: [] as string[],
  };

  function createBuilder(table: "items" | "usage_logs") {
    type QueryRow = MockItemRow;
    const filters = {
      eq: [] as Array<{ column: string; value: unknown }>,
      contains: [] as Array<{ column: string; value: unknown }>,
      in: [] as Array<{ column: string; values: unknown[] }>,
      order: null as null | { column: string; ascending: boolean },
      limit: null as null | number,
      action: "select" as "select" | "delete",
      selectedColumns: "*" as "*" | string[],
      countOption: null as null | "exact",
      headOption: false as boolean,
    };

    function applySelectedColumns(rows: Array<Record<string, unknown>>) {
      const columns = filters.selectedColumns;

      if (columns === "*") {
        return rows;
      }

      return rows.map((row) =>
        Object.fromEntries(
          columns.map((column) => [column, row[column]]),
        ),
      );
    }

    const builder = {
      select(columns?: string, options?: { count?: "exact"; head?: boolean }) {
        if (options?.count) {
          filters.countOption = options.count;
        }
        if (options?.head) {
          filters.headOption = true;
        }

        if (!columns || columns.trim() === "*") {
          filters.selectedColumns = "*";
          return builder;
        }

        filters.selectedColumns = columns
          .split(",")
          .map((column) => column.trim())
          .filter(Boolean);

        return builder;
      },
      eq(column: string, value: unknown) {
        filters.eq.push({ column, value });
        return builder;
      },
      contains(column: string, value: unknown) {
        filters.contains.push({ column, value });
        state.containsCalls.push({ column, value });
        return builder;
      },
      or(value: string) {
        state.orCalls.push(value);
        return builder;
      },
      in(column: string, values: unknown[]) {
        filters.in.push({ column, values });
        return builder;
      },
      order(column: string, options: { ascending: boolean }) {
        filters.order = { column, ascending: options.ascending };
        return builder;
      },
      limit(value: number) {
        filters.limit = value;
        return builder;
      },
      delete() {
        filters.action = "delete";
        return builder;
      },
      maybeSingle() {
        return Promise.resolve(runQuery().data.at(0) ?? null).then((data) => ({
          data,
          error: null,
        }));
      },
      then(resolve: (value: { data: unknown[]; error: null; count?: number | null }) => unknown) {
        return Promise.resolve(runQuery()).then(resolve);
      },
    };

    function runQuery() {
      let rows: QueryRow[] = table === "items" ? [...state.items] : [];

      for (const filter of filters.eq) {
        rows = rows.filter((row) => row[filter.column as keyof typeof row] === filter.value);
      }

      for (const filter of filters.contains) {
        rows = rows.filter((row) => {
          const rowValue = row[filter.column as keyof typeof row];
          if (!Array.isArray(rowValue) || !Array.isArray(filter.value)) {
            return false;
          }

          return filter.value.every((value) => rowValue.includes(value));
        });
      }

      for (const filter of filters.in) {
        rows = rows.filter((row) =>
          filter.values.includes(row[filter.column as keyof typeof row]),
        );
      }

      if (filters.action === "delete" && table === "items") {
        const itemRows = rows as MockItemRow[];
        const matchedIds = new Set(itemRows.map((row) => row.id));
        state.items = state.items.filter((row) => !matchedIds.has(row.id));
        return {
          data: applySelectedColumns(itemRows),
          error: null,
        };
      }

      if (filters.order) {
        const { column, ascending } = filters.order;
        rows.sort((left, right) => {
          const leftValue = left[column as keyof typeof left];
          const rightValue = right[column as keyof typeof right];

          if (leftValue === rightValue) {
            return 0;
          }

          if (leftValue == null) {
            return ascending ? -1 : 1;
          }

          if (rightValue == null) {
            return ascending ? 1 : -1;
          }

          return ascending
            ? String(leftValue).localeCompare(String(rightValue))
            : String(rightValue).localeCompare(String(leftValue));
        });
      }

      if (filters.limit !== null) {
        rows = rows.slice(0, filters.limit);
      }

      const result: { data: unknown[]; error: null; count?: number | null } = {
        data: filters.headOption ? [] : applySelectedColumns(rows as Array<Record<string, unknown>>),
        error: null,
      };

      if (filters.countOption) {
        result.count = rows.length;
      }

      return result;
    }

    return builder;
  }

  return {
    state,
    client: {
      from(table: "items" | "usage_logs") {
        return createBuilder(table);
      },
      rpc(fnName: string) {
        if (fnName === "get_latest_copied_at") {
          return Promise.resolve({ data: [], error: null });
        }
        return Promise.resolve({ data: null, error: new Error(`Unknown RPC: ${fnName}`) });
      },
    },
  };
}

describe("item repository helpers", () => {
  beforeEach(() => {
    requireAppUserMock.mockResolvedValue({ id: "user-1" });
    getServerSupabaseClientMock.mockReset();
  });

  it("defaults missing category to Other", () => {
    expect(
      buildItemInsert("user-1", {
        type: "prompt",
        content: "raw prompt",
        tags: [],
      }).category,
    ).toBe("Other");
  });

  it("does not send undefined fields in updates", () => {
    expect(buildItemUpdate({ title: "New title", summary: undefined })).toEqual({
      title: "New title",
    });
  });

  it("normalizes list filters", () => {
    expect(
      sanitizeListItemsInput({
        search: "  prompt  ",
        tag: "  react  ",
        sort: "used",
      }),
    ).toMatchObject({
      search: "prompt",
      tag: "react",
      sort: "used",
      limit: 50,
    });
  });

  it("sorts items by latest copy timestamp before updatedAt", () => {
    const items = [
      {
        id: "item-1",
        updatedAt: "2026-05-01T08:00:00.000Z",
      },
      {
        id: "item-2",
        updatedAt: "2026-05-01T10:00:00.000Z",
      },
      {
        id: "item-3",
        updatedAt: "2026-05-01T09:00:00.000Z",
      },
    ];

    expect(
      sortItemsByRecentUsage(items, {
        "item-1": "2026-05-01T11:00:00.000Z",
        "item-3": "2026-05-01T07:00:00.000Z",
      }).map((item) => item.id),
    ).toEqual(["item-1", "item-2", "item-3"]);
  });

  it("filters by tag and sorts by recent usage in listItems", async () => {
    const supabase = createSupabaseMock({
      items: [
        createItemRow({
          id: "item-1",
          tags: ["react"],
          updated_at: "2026-05-01T08:00:00.000Z",
        }),
        createItemRow({
          id: "item-2",
          tags: ["react"],
          updated_at: "2026-05-01T10:00:00.000Z",
        }),
        createItemRow({
          id: "item-3",
          tags: ["vue"],
          updated_at: "2026-05-01T12:00:00.000Z",
        }),
      ],
    });
    getServerSupabaseClientMock.mockResolvedValue(supabase.client);

    const items = await listItems({
      tag: "react",
      sort: "used",
    });

    expect(items.map((item) => item.id)).toEqual(["item-2", "item-1"]);
    expect(supabase.state.containsCalls).toEqual([
      {
        column: "tags",
        value: ["react"],
      },
    ]);
  });

  it("strips raw PostgREST OR syntax characters from search input", async () => {
    const supabase = createSupabaseMock({
      items: [
        createItemRow({
          id: "item-1",
          title: "Prompt",
        }),
      ],
    });
    getServerSupabaseClientMock.mockResolvedValue(supabase.client);

    await listItems({
      search: 'alpha),id.neq.1,{x}"_%*',
    });

    expect(supabase.state.orCalls).toHaveLength(1);
    expect(supabase.state.orCalls[0]).toBe(
      "title.ilike.*alpha  id.neq.1  x  \\_\\%*,summary.ilike.*alpha  id.neq.1  x  \\_\\%*,content.ilike.*alpha  id.neq.1  x  \\_\\%*",
    );
  });

  it("deletes a single item for the current user", async () => {
    const supabase = createSupabaseMock({
      items: [
        createItemRow({
          id: "item-1",
          type: "skill",
          title: "Delete me",
          tags: ["cleanup"],
        }),
        createItemRow({ id: "item-2", user_id: "user-2" }),
      ],
    });
    getServerSupabaseClientMock.mockResolvedValue(supabase.client);

    await expect(deleteItem("item-1")).resolves.toMatchObject({
      id: "item-1",
      type: "skill",
      title: "Delete me",
      tags: ["cleanup"],
    });
    expect(supabase.state.items.map((item) => item.id)).toEqual(["item-2"]);
  });

  it("builds dashboard snapshot with counts, favorites, pending, and recent", async () => {
    const supabase = createSupabaseMock({
      items: [
        createItemRow({
          id: "prompt-1",
          type: "prompt",
          is_favorite: true,
          updated_at: "2026-05-01T08:00:00.000Z",
        }),
        createItemRow({
          id: "skill-1",
          type: "skill",
          is_favorite: true,
          is_analyzed: false,
          updated_at: "2026-05-01T10:00:00.000Z",
        }),
        createItemRow({
          id: "prompt-2",
          type: "prompt",
          is_analyzed: false,
          updated_at: "2026-05-01T09:00:00.000Z",
        }),
        createItemRow({
          id: "pending-3",
          type: "skill",
          is_analyzed: false,
          updated_at: "2026-05-01T08:30:00.000Z",
        }),
        createItemRow({
          id: "pending-4",
          type: "prompt",
          is_analyzed: false,
          updated_at: "2026-05-01T08:15:00.000Z",
        }),
        createItemRow({
          id: "pending-5",
          type: "skill",
          is_analyzed: false,
          updated_at: "2026-05-01T08:05:00.000Z",
        }),
      ],
    });
    getServerSupabaseClientMock.mockResolvedValue(supabase.client);

    const snapshot = await getDashboardSnapshot();

    expect(snapshot.counts).toEqual({
      total: 6,
      prompts: 3,
      skills: 3,
      tools: 0,
      pending: 5,
    });
    expect(snapshot.favorites.map((item) => item.id)).toEqual([
      "skill-1",
      "prompt-1",
    ]);
    expect(snapshot.pending.map((item) => item.id)).toEqual([
      "skill-1",
      "prompt-2",
      "pending-3",
      "pending-4",
    ]);
    expect(snapshot.recent.map((item) => item.id)).toEqual([
      "skill-1",
      "prompt-2",
      "pending-3",
      "pending-4",
    ]);
  });

  it("keeps enough dashboard favorites to fill the expanded card", async () => {
    const supabase = createSupabaseMock({
      items: Array.from({ length: 5 }, (_, index) =>
        createItemRow({
          id: `favorite-${index + 1}`,
          is_favorite: true,
          updated_at: `2026-05-01T0${index}:00:00.000Z`,
        }),
      ),
    });
    getServerSupabaseClientMock.mockResolvedValue(supabase.client);

    const snapshot = await getDashboardSnapshot();

    expect(snapshot.favorites.map((item) => item.id)).toEqual([
      "favorite-5",
      "favorite-4",
      "favorite-3",
      "favorite-2",
      "favorite-1",
    ]);
  });
});
