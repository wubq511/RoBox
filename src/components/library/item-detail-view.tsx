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
import type { ItemDetail } from "@/server/db/types";

import { CopyRawButton } from "./copy-raw-button";
import { DeleteItemButton } from "./delete-item-button";

type ItemDetailViewProps = {
  item: ItemDetail;
  returnPath: string;
};

export function ItemDetailView({
  item,
  returnPath,
}: Readonly<ItemDetailViewProps>) {
  const normalizedReturnPath = returnPath.endsWith("/")
    ? returnPath.slice(0, -1)
    : returnPath;
  const editPath = `${normalizedReturnPath}/${item.id}/edit`;
  const revalidatePaths = [
    "/dashboard",
    normalizedReturnPath,
    `${normalizedReturnPath}/${item.id}`,
  ];

  return (
    <Card className="rounded-[28px] border-border/70">
      <CardHeader className="gap-4 border-b border-border/70 pb-5">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="outline" className="rounded-full px-2.5">
            {item.type}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">
            {item.updatedAt}
          </span>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl tracking-[-0.03em]">
            {item.title}
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            {item.summary}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-2.5">
            {item.category}
          </Badge>
          {item.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="rounded-full px-2.5">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={normalizedReturnPath}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Back
          </Link>
          <Link
            href={editPath}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit
          </Link>
          <DeleteItemButton itemId={item.id} type={item.type} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {item.type === "prompt" ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Variables</h3>
              <span className="font-mono text-xs text-muted-foreground">
                {item.variables.length}
              </span>
            </div>
            {item.variables.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No variables yet. You can still copy the raw prompt.
              </div>
            ) : (
              <div className="space-y-3">
                {item.variables.map((variable) => (
                  <div
                    key={variable.name}
                    className="rounded-2xl border border-border/70 bg-muted/30 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono text-sm font-medium">
                        {variable.name}
                      </div>
                      {variable.required ? (
                        <Badge variant="outline" className="rounded-full px-2.5">
                          Required
                        </Badge>
                      ) : null}
                    </div>
                    {variable.description ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {variable.description}
                      </p>
                    ) : null}
                    {variable.defaultValue ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Default: {variable.defaultValue}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {item.type === "skill" && item.sourceUrl ? (
          <section className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Source
            </p>
            <p className="mt-2 break-all font-mono text-xs leading-6 text-muted-foreground">
              {item.sourceUrl}
            </p>
          </section>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">
              {item.type === "prompt" ? "Raw prompt" : "Raw skill"}
            </h3>
            <CopyRawButton
              itemId={item.id}
              content={item.content}
              revalidatePaths={revalidatePaths}
            />
          </div>
          <pre className="overflow-x-auto rounded-[22px] border border-border/70 bg-muted/30 p-4 font-mono text-xs leading-6 whitespace-pre-wrap text-muted-foreground">
            {item.content}
          </pre>
        </section>
      </CardContent>
    </Card>
  );
}
