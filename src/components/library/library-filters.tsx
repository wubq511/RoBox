import Link from "next/link";
import { RotateCcwIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      className="flex flex-wrap items-end gap-3 rounded-[24px] border border-border/70 bg-background/90 p-4"
    >
      <div className="flex flex-1 items-end gap-3 min-w-0">
        <label className="w-[260px] space-y-2 shrink-0">
          <span className="text-xs font-medium text-muted-foreground">搜索</span>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              defaultValue={filters.search ?? ""}
              placeholder="搜索 Prompt / 标签 / 描述"
              className="h-8 rounded-lg pl-9"
            />
          </div>
        </label>

        <label className="w-[140px] space-y-2 shrink-0">
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

        <label className="w-[140px] space-y-2 shrink-0">
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

        <label className="space-y-2 shrink-0">
          <span className="text-xs font-medium text-muted-foreground">筛选</span>
          <div className="flex h-8 items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="favorite"
              value="1"
              defaultChecked={filters.isFavorite ?? false}
            />
            仅收藏
          </div>
        </label>
      </div>

      <div className="flex items-end gap-2 shrink-0">
        <Link href={action}>
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 px-4">
            <RotateCcwIcon className="size-3.5" />
            重置
          </Button>
        </Link>
        <Button type="submit" size="sm" className="h-8 px-6">
          应用筛选
        </Button>
      </div>
    </form>
  );
}
