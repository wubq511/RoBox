import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ListItemsFilters, ItemType } from "@/lib/schema/items";
import type { StoredItem } from "@/server/db/types";

import { LibraryFilters } from "./library-filters";

type LibraryListProps = {
  type: ItemType;
  items: StoredItem[];
  filters: ListItemsFilters;
};

function getShellCopy(type: ItemType) {
  return type === "prompt"
    ? {
        shellTitle: "Prompt library",
        shellDescription: "Variables, raw copy, edit, and saved search.",
        createLabel: "Create now",
        emptyTitle: "No prompts yet",
        emptyDescription:
          "Change the keyword or filters, or create your first saved item.",
      }
    : {
        shellTitle: "Skill library",
        shellDescription:
          "Save reusable SKILL.md files, linked sources, and copy-ready notes.",
        createLabel: "Create now",
        emptyTitle: "No skills yet",
        emptyDescription:
          "Change the keyword or filters, or create your first saved item.",
      };
}

function getCreateHref(type: ItemType) {
  return type === "prompt" ? "/prompts/new" : "/skills/new";
}

function getDetailHref(type: ItemType, itemId: string) {
  return type === "prompt" ? `/prompts/${itemId}` : `/skills/${itemId}`;
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
              <Button render={<a href={createHref} />}>{shellCopy.createLabel}</Button>
            </CardContent>
          </Card>
        );
      })()
    ) : (
      <div className="space-y-4" data-sort={filters.sort}>
        {items.map((item) => {
          const body = (
            <article
              className="rounded-[24px] border border-border/70 bg-background/90 p-5 shadow-[0_10px_24px_-22px_rgba(17,17,17,0.35)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2.5">
                    {item.type}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full px-2.5">
                    {item.category}
                  </Badge>
                  {item.isFavorite ? (
                    <Badge variant="outline" className="rounded-full px-2.5">
                      Favorite
                    </Badge>
                  ) : null}
                  {!item.isAnalyzed ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-amber-300 bg-amber-50 px-2.5 text-amber-700"
                    >
                      Need analyze
                    </Badge>
                  ) : null}
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs text-muted-foreground">
                    {item.updatedAt}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Copied {item.usageCount}
                  </div>
                </div>
              </div>

              <h2 className="mt-4 text-lg font-semibold tracking-[-0.02em]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.summary}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="rounded-full px-2.5"
                  >
                    {tag}
                  </Badge>
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
        <CardHeader className="gap-4 border-b border-border/70 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-3xl tracking-[-0.04em]">
                {shellCopy.shellTitle}
              </CardTitle>
              <CardDescription className="mt-2 text-sm leading-6">
                {shellCopy.shellDescription}
              </CardDescription>
            </div>
            <Button render={<a href={createHref} />}>{shellCopy.createLabel}</Button>
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
