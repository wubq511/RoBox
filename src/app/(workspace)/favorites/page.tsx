import { FavoritesList } from "@/components/library/favorites-list";
import { parseFavoritesSearchParams } from "@/features/items/query-state";
import { listItems } from "@/server/db/items";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function FavoritesPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<SearchParams>;
}>) {
  const params = await searchParams;
  const filters = parseFavoritesSearchParams(params);
  const items = await listItems(filters, { nextPath: "/favorites" });

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8">
      <FavoritesList items={items} filters={filters} />
    </main>
  );
}
