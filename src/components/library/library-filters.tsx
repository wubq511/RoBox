import { Input } from "@/components/ui/input";
import { itemCategories, type ItemSort, type ItemType } from "@/lib/schema/items";

type LibraryFiltersProps = {
  type: ItemType;
  search?: string;
  category?: string;
  tag?: string;
  isFavorite?: boolean;
  sort?: ItemSort;
};

export function LibraryFilters({
  type,
  search = "",
  category = "",
  tag = "",
  isFavorite = false,
  sort = "updated",
}: Readonly<LibraryFiltersProps>) {
  return (
    <form className="grid gap-3 rounded-[24px] border border-border/70 bg-background/90 p-4 md:grid-cols-2 xl:grid-cols-5">
      <label className="space-y-2 xl:col-span-2">
        <span className="text-xs font-medium text-muted-foreground">Search</span>
        <Input
          name="search"
          defaultValue={search}
          placeholder={`Search ${type === "prompt" ? "prompts" : "skills"}`}
        />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">Category</span>
        <select
          name="category"
          defaultValue={category}
          className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none"
        >
          <option value="">All categories</option>
          {itemCategories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">Tag</span>
        <Input name="tag" defaultValue={tag} placeholder="react" />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">Sort</span>
        <select
          name="sort"
          defaultValue={sort}
          className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none"
        >
          <option value="updated">Updated</option>
          <option value="used">Recently used</option>
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-muted-foreground xl:col-span-5">
        <input
          type="checkbox"
          name="favorite"
          value="1"
          defaultChecked={isFavorite}
        />
        Favorites only
      </label>
    </form>
  );
}
