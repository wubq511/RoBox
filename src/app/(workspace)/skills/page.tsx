import { LibraryList } from "@/components/library/library-list";
import { parseLibrarySearchParams } from "@/features/items/query-state";
import { listItems } from "@/server/db/items";
import { getUserCategoryNames } from "@/server/db/categories";
import { requireAppUser } from "@/server/auth/session";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SkillsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<SearchParams>;
}>) {
  const params = await searchParams;
  const filters = parseLibrarySearchParams(params, "skill");
  const user = await requireAppUser();
  const [items, categories] = await Promise.all([
    listItems(filters, { userId: user.id }),
    getUserCategoryNames(user.id, "skill"),
  ]);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8">
      <LibraryList type="skill" items={items} filters={filters} categories={categories} />
    </main>
  );
}
