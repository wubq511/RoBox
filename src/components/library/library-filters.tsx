import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  itemCategories,
  type ListItemsFilters,
  type ItemType,
} from "@/lib/schema/items";

type LibraryFiltersProps = {
  type: ItemType;
  filters: ListItemsFilters;
};

export function LibraryFilters({
  type,
  filters,
}: Readonly<LibraryFiltersProps>) {
  const action = type === "prompt" ? "/prompts" : "/skills";

  return (
    <form
      action={action}
      className="grid gap-3 rounded-[24px] border border-border/70 bg-background/90 p-4 md:grid-cols-2 xl:grid-cols-5"
    >
      <label className="space-y-2 xl:col-span-2">
        <span className="text-xs font-medium text-muted-foreground">搜索</span>
        <Input
          name="search"
          defaultValue={filters.search ?? ""}
          placeholder={`搜索 ${type === "prompt" ? "Prompt" : "Skill"}`}
        />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">分类</span>
        <select
          name="category"
          defaultValue={filters.category ?? ""}
          className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none"
        >
          <option value="">全部分类</option>
          {itemCategories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">标签</span>
        <Input name="tag" defaultValue={filters.tag ?? ""} placeholder="react" />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">排序</span>
        <select
          name="sort"
          defaultValue={filters.sort}
          className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none"
        >
          <option value="updated">最近更新</option>
          <option value="used">最近使用</option>
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-muted-foreground xl:col-span-5">
        <input
          type="checkbox"
          name="favorite"
          value="1"
          defaultChecked={filters.isFavorite ?? false}
        />
        仅收藏
      </label>

      <div className="xl:col-span-5">
        <Button type="submit" size="sm">
          Apply
        </Button>
      </div>
    </form>
  );
}
