import type { ListItemsFilters } from "@/lib/schema/items";
import { sanitizeListItemsInput } from "@/server/db/items";

type LibraryPath = "/prompts" | "/skills";
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

function getTypeFromPath(pathname: LibraryPath): ListItemsFilters["type"] {
  return pathname === "/skills" ? "skill" : "prompt";
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

export function parseLibrarySearchParams(
  pathname: LibraryPath,
  searchParams: SearchParamsInput,
) {
  return sanitizeListItemsInput({
    type: getTypeFromPath(pathname),
    category: normalizeString(getSingleParam(searchParams, "category")),
    tag: normalizeString(getSingleParam(searchParams, "tag")),
    search: normalizeString(
      getSingleParam(searchParams, "q") ??
        getSingleParam(searchParams, "search"),
    ),
    sort: getSingleParam(searchParams, "sort"),
    isFavorite:
      getSingleParam(searchParams, "favorite") === "1" ? true : undefined,
    limit: normalizeLimit(getSingleParam(searchParams, "limit")),
  });
}

export function buildLibraryHref(
  pathname: LibraryPath,
  filters: Partial<ListItemsFilters>,
) {
  const parsed = sanitizeListItemsInput({
    type: getTypeFromPath(pathname),
    category: normalizeString(filters.category),
    tag: normalizeString(filters.tag),
    search: normalizeString(filters.search),
    sort: filters.sort,
    isFavorite: filters.isFavorite,
    limit: normalizeLimit(filters.limit),
  });
  const searchParams = new URLSearchParams();

  if (parsed.search) {
    searchParams.set("q", parsed.search);
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

  if (parsed.sort !== "recent") {
    searchParams.set("sort", parsed.sort);
  }

  if (parsed.limit !== 50) {
    searchParams.set("limit", String(parsed.limit));
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
