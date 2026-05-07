import { LibraryList } from "@/components/library/library-list";
import { parseLibrarySearchParams } from "@/features/items/query-state";
import { getUserCategoryNames, ensureDefaultCategories } from "@/server/db/categories";
import { listItems } from "@/server/db/items";
import { requireAppUser } from "@/server/auth/session";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ToolsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<SearchParams>;
}>) {
  const params = await searchParams;
  const filters = parseLibrarySearchParams(params, "tool");
  const [items, user] = await Promise.all([
    listItems(filters),
    requireAppUser(),
  ]);

  await ensureDefaultCategories(user.id);
  const categories = await getUserCategoryNames(user.id, "tool");

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8">
      <LibraryList type="tool" items={items} filters={filters} categories={categories} />
    </main>
  );
}
