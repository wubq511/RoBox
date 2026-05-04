import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ListItemsFilters, ItemType } from "@/lib/schema/items";
import type { StoredItem } from "@/server/db/types";

import { FavoriteToggleButton } from "./favorite-toggle-button";
import { LibraryFilters } from "./library-filters";

type LibraryListProps = {
  type: ItemType;
  items: StoredItem[];
  filters: ListItemsFilters;
};

function getShellCopy(type: ItemType) {
  return type === "prompt"
    ? {
        shellTitle: "Prompt 库",
        shellDescription: "管理和使用你的 Prompt 模板。",
        createLabel: "新建 Prompt",
        emptyTitle: "还没有 Prompt",
        emptyDescription: "创建你的第一个 Prompt 开始。",
      }
    : {
        shellTitle: "Skill 库",
        shellDescription: "管理和使用你的 Skill 文件。",
        createLabel: "新建 Skill",
        emptyTitle: "还没有 Skill",
        emptyDescription: "创建你的第一个 Skill 开始。",
      };
}

function getCreateHref(type: ItemType) {
  return type === "prompt" ? "/prompts/new" : "/skills/new";
}

function getDetailHref(type: ItemType, itemId: string) {
  return type === "prompt" ? `/prompts/${itemId}` : `/skills/${itemId}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;

  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function LibraryList({
  type,
  items,
  filters,
}: Readonly<LibraryListProps>) {
  const shellCopy = getShellCopy(type);
  const createHref = getCreateHref(type);
  const content =
    items.length === 0 ? (
      (() => {
        return (
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
        );
      })()
    ) : (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" data-sort={filters.sort}>
        {items.map((item) => {
          const body = (
            <article
              className="rounded-[24px] border border-border/70 bg-background/90 p-5 shadow-[0_10px_24px_-22px_rgba(17,17,17,0.35)] h-full flex flex-col"
            >
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
          );

          return (
            <a key={item.id} href={getDetailHref(type, item.id)} className="block">
              {body}
            </a>
          );
        })}
      </div>
    );

  return (
    <section className="space-y-4">
      <Card className="rounded-[28px] border-border/70">
        <CardHeader className="border-b border-border/70 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <CardTitle className="text-3xl tracking-[-0.04em]">
              {shellCopy.shellTitle}
            </CardTitle>
            <Link
              href={createHref}
              className={cn(buttonVariants({ variant: "default" }))}
            >
              {shellCopy.createLabel}
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <LibraryFilters type={type} filters={filters} />
        </CardContent>
      </Card>
      {content}
    </section>
  );
}
