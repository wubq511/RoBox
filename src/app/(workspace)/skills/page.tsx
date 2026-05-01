import { LibraryList } from "@/components/library/library-list";
import { parseLibrarySearchParams } from "@/features/items/query-state";
import { listItems } from "@/server/db/items";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SkillsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<SearchParams>;
}>) {
  const params = await searchParams;
  const filters = parseLibrarySearchParams(params, "skill");
  const items = await listItems(filters);

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-6 lg:px-8 lg:py-8">
      <LibraryList type="skill" items={items} filters={filters} />
    </main>
  );
}
