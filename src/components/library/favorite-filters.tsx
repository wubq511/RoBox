"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcwIcon, SearchIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ListItemsFilters } from "@/lib/schema/items";
import { cn } from "@/lib/utils";

export function FavoriteFilters({
  filters,
}: Readonly<{
  filters: ListItemsFilters;
}>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      const query = params.toString();
      router.push(query ? `/favorites?${query}` : "/favorites");
    },
    [router, searchParams],
  );

  const handleSearch = useCallback(
    (formData: FormData) => {
      updateFilters({
        search: String(formData.get("search") ?? "").trim(),
        type: String(formData.get("type") ?? ""),
        sort: String(formData.get("sort") ?? "updated"),
      });
    },
    [updateFilters],
  );

  return (
    <form
      action={handleSearch}
      className="flex flex-wrap items-end gap-3 rounded-[20px] border border-border/70 bg-background/90 p-4"
    >
      <label className="min-w-[240px] flex-1 space-y-2">
        <span className="text-xs font-medium text-muted-foreground">搜索</span>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={filters.search ?? ""}
            placeholder="搜索收藏标题 / 描述 / 内容"
            className="h-8 rounded-lg pl-9"
          />
        </div>
      </label>

      <label className="w-[140px] space-y-2">
        <span className="text-xs font-medium text-muted-foreground">类型</span>
        <select
          name="type"
          defaultValue={filters.type ?? ""}
          className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none"
        >
          <option value="">全部类型</option>
          <option value="prompt">Prompt</option>
          <option value="skill">Skill</option>
          <option value="tool">Tool</option>
        </select>
      </label>

      <label className="w-[140px] space-y-2">
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

      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-4"
          onClick={() => router.push("/favorites")}
        >
          <RotateCcwIcon className="size-3.5" />
          重置
        </Button>
        <button
          type="submit"
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "h-8 px-6",
          )}
        >
          应用筛选
        </button>
      </div>
    </form>
  );
}
