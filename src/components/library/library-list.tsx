import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LibraryItem, ItemType } from "@/features/items/types";

type LibraryListProps = {
  type: ItemType;
  items: LibraryItem[];
  selectedItemId?: string;
  getItemHref?: (item: LibraryItem) => string;
  createHref?: string;
};

function getEmptyCopy(type: ItemType) {
  return type === "prompt"
    ? {
        title: "No prompts yet",
        description: "Create your first Prompt to start saving and copying templates.",
        action: "Create Prompt",
      }
    : {
        title: "No skills yet",
        description: "Create your first Skill to keep reusable instructions close at hand.",
        action: "Create Skill",
      };
}

export function LibraryList({
  type,
  items,
  selectedItemId,
  getItemHref,
  createHref,
}: Readonly<LibraryListProps>) {
  if (items.length === 0) {
    const emptyCopy = getEmptyCopy(type);

    return (
      <Card className="rounded-[28px] border-border/70">
        <CardHeader>
          <CardTitle>{emptyCopy.title}</CardTitle>
          <CardDescription>{emptyCopy.description}</CardDescription>
        </CardHeader>
        {createHref ? (
          <CardContent>
            <Button render={<a href={createHref} />}>{emptyCopy.action}</Button>
          </CardContent>
        ) : null}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const body = (
          <article
            className={`rounded-[24px] border p-5 shadow-[0_10px_24px_-22px_rgba(17,17,17,0.35)] ${
              selectedItemId === item.id
                ? "border-foreground/20 bg-muted/30"
                : "border-border/70 bg-background/90"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2.5">
                  {item.type}
                </Badge>
                {!item.isAnalyzed ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-amber-300 bg-amber-50 px-2.5 text-amber-700"
                  >
                    Need analyze
                  </Badge>
                ) : null}
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {item.updatedAt}
              </span>
            </div>

            <h2 className="mt-4 text-lg font-semibold tracking-[-0.02em]">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {item.summary}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full px-2.5">
                #{item.category}
              </Badge>
              {item.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="rounded-full px-2.5">
                  {tag}
                </Badge>
              ))}
            </div>
          </article>
        );

        if (!getItemHref) {
          return <div key={item.id}>{body}</div>;
        }

        return (
          <a key={item.id} href={getItemHref(item)} className="block">
            {body}
          </a>
        );
      })}
    </div>
  );
}
