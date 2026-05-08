import { memo, Suspense } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { ListItemsFilters, ItemType } from "@/lib/schema/items";
import type { StoredItem } from "@/server/db/types";

import { BatchAnalyzeButton } from "./batch-analyze-button";
import { FavoriteToggleButton } from "./favorite-toggle-button";
import { LibraryFilters } from "./library-filters";

type LibraryListProps = {
  type: ItemType;
  items: StoredItem[];
  filters: ListItemsFilters;
  categories: string[];
};

function getShellCopy(type: ItemType) {
  if (type === "prompt") {
    return {
      shellTitle: "Prompt 库",
      shellDescription: "管理和使用你的 Prompt 模板。",
      createLabel: "新建 Prompt",
      emptyTitle: "还没有 Prompt",
      emptyDescription: "创建你的第一个 Prompt 开始。",
    };
  }

  if (type === "tool") {
    return {
      shellTitle: "Tool 库",
      shellDescription: "管理和使用你的工具仓库与网站。",
      createLabel: "新建 Tool",
      emptyTitle: "还没有 Tool",
      emptyDescription: "保存你的第一个 Tool 开始。",
    };
  }

  return {
    shellTitle: "Skill 库",
    shellDescription: "管理和使用你的 Skill 文件。",
    createLabel: "新建 Skill",
    emptyTitle: "还没有 Skill",
    emptyDescription: "创建你的第一个 Skill 开始。",
  };
}

function getCreateHref(type: ItemType) {
  return type === "prompt" ? "/prompts/new" : type === "tool" ? "/tools/new" : "/skills/new";
}

function getDetailHref(type: ItemType, itemId: string) {
  return type === "prompt" ? `/prompts/${itemId}` : type === "tool" ? `/tools/${itemId}` : `/skills/${itemId}`;
}

const ItemCard = memo(function ItemCard({
  item,
  type,
}: Readonly<{
  item: StoredItem;
  type: ItemType;
}>) {
  return (
    <Link href={getDetailHref(type, item.id)} className="block">
      <article className="rounded-[24px] border border-border/70 bg-background/90 p-5 shadow-[0_10px_24px_-22px_rgba(17,17,17,0.35)] h-full flex flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {item.type} / {item.category}
            </span>
            {!item.isAnalyzed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                <span className="size-1 rounded-full bg-amber-500"></span>
                待整理
              </span>
            ) : null}
            <FavoriteToggleButton
              itemId={item.id}
              itemType={item.type}
              isFavorite={item.isFavorite}
            />
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground">
              {formatDate(item.updatedAt)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              复制 {item.usageCount} 次
            </div>
          </div>
        </div>

        <h2 className="mt-4 text-lg font-semibold tracking-[-0.02em]">
          {item.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">
          {item.summary}
        </p>

        <div className="mt-auto pt-4 flex flex-wrap gap-2">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded-md">
              #{tag}
            </span>
          ))}
        </div>
      </article>
    </Link>
  );
});

export function LibraryList({
  type,
  items,
  filters,
  categories,
}: Readonly<LibraryListProps>) {
  const shellCopy = getShellCopy(type);
  const createHref = getCreateHref(type);
  const content =
    items.length === 0 ? (
      <Card className="rounded-[28px] border-border/70">
        <CardHeader>
          <CardTitle>{shellCopy.emptyTitle}</CardTitle>
          <CardDescription>{shellCopy.emptyDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={createHref}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            {shellCopy.createLabel}
          </Link>
        </CardContent>
      </Card>
    ) : (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" data-sort={filters.sort}>
        {items.map((item) => (
          <ItemCard key={item.id} item={item} type={type} />
        ))}
      </div>
    );

  return (
    <section className="space-y-4">
      <Card className="rounded-[28px] border-border/70">
        <CardHeader className="border-b border-border/70 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <CardTitle className="text-3xl tracking-[-0.04em]">
              {shellCopy.shellTitle}
            </CardTitle>
            <div className="flex items-center gap-2">
              <BatchAnalyzeButton
                type={type}
                items={items.filter((item) => !item.isAnalyzed)}
              />
              <Link
                href={createHref}
                className={cn(buttonVariants({ variant: "default" }))}
              >
                {shellCopy.createLabel}
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          <Suspense>
            <LibraryFilters type={type} filters={filters} categories={categories} />
          </Suspense>
        </CardContent>
      </Card>
      {content}
    </section>
  );
}
