import Link from "next/link";
import {
  ArrowRightIcon,
  BlocksIcon,
  RotateCcwIcon,
  SearchIcon,
  StarIcon,
  WandSparklesIcon,
  WrenchIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import type { ItemType, ListItemsFilters } from "@/lib/schema/items";
import { cn } from "@/lib/utils";
import type { StoredItem } from "@/server/db/types";

import { FavoriteToggleButton } from "./favorite-toggle-button";

type FavoritesListProps = {
  items: StoredItem[];
  filters: ListItemsFilters;
};

const itemTypeMeta: Record<
  ItemType,
  {
    label: string;
    hrefPrefix: string;
    icon: React.ReactNode;
  }
> = {
  prompt: {
    label: "Prompt",
    hrefPrefix: "/prompts",
    icon: <BlocksIcon className="size-4" />,
  },
  skill: {
    label: "Skill",
    hrefPrefix: "/skills",
    icon: <WandSparklesIcon className="size-4" />,
  },
  tool: {
    label: "Tool",
    hrefPrefix: "/tools",
    icon: <WrenchIcon className="size-4" />,
  },
};

function getItemHref(item: Pick<StoredItem, "id" | "type">) {
  return `${itemTypeMeta[item.type].hrefPrefix}/${item.id}`;
}

function FavoriteFilters({
  filters,
}: Readonly<{
  filters: ListItemsFilters;
}>) {
  return (
    <form
      action="/favorites"
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
        <Link
          href="/favorites"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-8 gap-1.5 px-4",
          )}
        >
          <RotateCcwIcon className="size-3.5" />
          重置
        </Link>
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "default", size: "sm" }), "h-8 px-6")}
        >
          应用筛选
        </button>
      </div>
    </form>
  );
}

function FavoriteItemCard({ item }: Readonly<{ item: StoredItem }>) {
  const meta = itemTypeMeta[item.type];

  return (
    <article className="flex h-full flex-col rounded-[22px] border border-border/70 bg-background/90 p-5 shadow-[0_10px_24px_-22px_rgba(17,17,17,0.35)] transition-colors hover:border-border">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {meta.icon}
            {meta.label}
          </span>
          <span className="truncate text-xs font-medium text-muted-foreground">
            {item.category}
          </span>
        </div>
        <FavoriteToggleButton
          itemId={item.id}
          itemType={item.type}
          isFavorite={item.isFavorite}
        />
      </div>

      <Link href={getItemHref(item)} className="group mt-4 block flex-1">
        <h2 className="text-lg font-semibold leading-snug text-foreground group-hover:underline">
          {item.title || "未命名收藏"}
        </h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
          {item.summary || item.content}
        </p>
      </Link>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-border/50 pt-4 text-xs text-muted-foreground">
        <span>{formatDate(item.updatedAt)}</span>
        <Link
          href={getItemHref(item)}
          className="inline-flex items-center gap-1 font-medium text-foreground/70 hover:text-foreground"
        >
          打开
          <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}

export function FavoritesList({
  items,
  filters,
}: Readonly<FavoritesListProps>) {
  return (
    <section className="space-y-4">
      <Card className="rounded-[28px] border-border/70">
        <CardHeader className="border-b border-border/70 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-3 text-3xl">
                <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <StarIcon className="size-5" />
                </span>
                收藏
              </CardTitle>
              <CardDescription>
                集中查看所有已收藏的 Prompt / Skill / Tool。
              </CardDescription>
            </div>
            <div className="rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-sm font-medium text-muted-foreground">
              已收藏 {items.length} 个
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          <FavoriteFilters filters={filters} />
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle>还没有收藏内容</CardTitle>
            <CardDescription>
              在 Prompt、Skill 或 Tool 详情里点亮星标后，会出现在这里。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/prompts" className={cn(buttonVariants({ variant: "outline" }))}>
              浏览 Prompts
            </Link>
            <Link href="/skills" className={cn(buttonVariants({ variant: "outline" }))}>
              浏览 Skills
            </Link>
            <Link href="/tools" className={cn(buttonVariants({ variant: "outline" }))}>
              浏览 Tools
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div
          className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"
          data-sort={filters.sort}
        >
          {items.map((item) => (
            <FavoriteItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
