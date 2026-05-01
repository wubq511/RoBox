import type { ItemType, ListItemsFilters } from "@/lib/schema/items";
import { sanitizeListItemsInput } from "@/server/db/items";

type SearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function getSingleParam(
  searchParams: SearchParamsInput,
  key: string,
): string | undefined {
  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(key) ?? undefined;
  }

  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function normalizeString(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeLimit(value: string | number | undefined) {
  const parsed =
    typeof value === "number" ? value : value ? Number.parseInt(value, 10) : NaN;

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.min(Math.max(parsed, 1), 100);
}

function getLibraryPath(type: ItemType) {
  return type === "skill" ? "/skills" : "/prompts";
}

export function parseLibrarySearchParams(
  searchParams: SearchParamsInput,
  type: ItemType,
) {
  return sanitizeListItemsInput({
    type,
    search: normalizeString(getSingleParam(searchParams, "search")),
    category: normalizeString(getSingleParam(searchParams, "category")),
    tag: normalizeString(getSingleParam(searchParams, "tag")),
    isFavorite:
      getSingleParam(searchParams, "favorite") === "1" ? true : undefined,
    sort: getSingleParam(searchParams, "sort"),
    limit: normalizeLimit(getSingleParam(searchParams, "limit")),
  });
}

export function buildLibraryHref(
  type: ItemType,
  filters: Partial<ListItemsFilters>,
) {
  const parsed = sanitizeListItemsInput({
    type,
    search: normalizeString(filters.search),
    category: normalizeString(filters.category),
    tag: normalizeString(filters.tag),
    isFavorite: filters.isFavorite,
    sort: filters.sort,
    limit: normalizeLimit(filters.limit),
  });
  const searchParams = new URLSearchParams();

  if (parsed.search) {
    searchParams.set("search", parsed.search);
  }

  if (parsed.category) {
    searchParams.set("category", parsed.category);
  }

  if (parsed.tag) {
    searchParams.set("tag", parsed.tag);
  }

  if (parsed.isFavorite) {
    searchParams.set("favorite", "1");
  }

  searchParams.set("sort", parsed.sort);

  if (parsed.limit !== 50) {
    searchParams.set("limit", String(parsed.limit));
  }

  const query = searchParams.toString();
  const pathname = getLibraryPath(type);
  return query ? `${pathname}?${query}` : pathname;
}
