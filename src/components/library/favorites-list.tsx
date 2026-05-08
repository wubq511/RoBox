import Link from "next/link";
import {
  ArrowRightIcon,
  BlocksIcon,
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
import { formatDate } from "@/lib/format";
import type { ItemType, ListItemsFilters } from "@/lib/schema/items";
import { cn } from "@/lib/utils";
import type { StoredItem } from "@/server/db/types";

import { FavoriteFilters } from "./favorite-filters";
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
