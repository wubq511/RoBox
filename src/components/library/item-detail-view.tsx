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

import { AnalyzeButton } from "./analyze-button";
import { CopyRawButton } from "./copy-raw-button";
import { DeleteItemButton } from "./delete-item-button";
import { PromptFinalPanel } from "./prompt-final-panel";

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
  const isImportedSkill = item.type === "skill" && Boolean(item.sourceUrl);
  const copyContent = isImportedSkill ? item.sourceUrl : item.content;
  const copyLabel =
    item.type === "prompt"
      ? "Copy raw"
      : isImportedSkill
        ? "Copy source URL"
        : "Copy raw skill";
  const rawContentLabel =
    item.type === "prompt"
      ? "Raw prompt"
      : isImportedSkill
        ? "Saved link"
        : "Raw skill";

  return (
    <Card className="rounded-[28px] border-border/70">
      <CardHeader className="gap-4 border-b border-border/70 pb-5">
        <div className="flex items-center justify-between gap-3">
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
          <AnalyzeButton itemId={item.id} isAnalyzed={item.isAnalyzed} />
          <DeleteItemButton itemId={item.id} type={item.type} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {item.type === "prompt" ? (
          <PromptFinalPanel
            itemId={item.id}
            content={item.content}
            variables={item.variables}
            revalidatePaths={revalidatePaths}
          />
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
            <h3 className="text-sm font-semibold">{rawContentLabel}</h3>
            <CopyRawButton
              itemId={item.id}
              content={copyContent}
              label={copyLabel}
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
