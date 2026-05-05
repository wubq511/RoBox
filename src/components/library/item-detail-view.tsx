import Link from "next/link";
import { ArrowLeftIcon, CalendarIcon, ExternalLinkIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { ItemDetail } from "@/server/db/types";

import { AnalyzeButton } from "./analyze-button";
import { CopyRawButton } from "./copy-raw-button";
import { DeleteItemButton } from "./delete-item-button";
import { FavoriteToggleButton } from "./favorite-toggle-button";
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

  return (
    <div className="space-y-6">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between">
        <Link
          href={normalizedReturnPath}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5 text-muted-foreground hover:text-foreground"
          )}
        >
          <ArrowLeftIcon className="size-4" />
          返回
        </Link>
        <div className="flex items-center gap-2">
          <FavoriteToggleButton
            itemId={item.id}
            itemType={item.type}
            isFavorite={item.isFavorite}
          />
          <Link
            href={editPath}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            编辑
          </Link>
          <AnalyzeButton itemId={item.id} isAnalyzed={item.isAnalyzed} />
          <DeleteItemButton itemId={item.id} itemType={item.type} />
        </div>
      </div>

      {/* 主内容卡片 */}
      <Card className="rounded-3xl border-border/60 shadow-sm">
        <CardHeader className="gap-4 pb-6">
          {/* 元信息行 */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {item.type} / {item.category}
              </span>
              {!item.isAnalyzed && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                  <span className="size-1.5 rounded-full bg-amber-500"></span>
                  待整理
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarIcon className="size-3.5" />
              <span className="text-xs">{formatDate(item.updatedAt)}</span>
            </div>
          </div>

          {/* 标题和摘要 */}
          <div className="space-y-3">
            <CardTitle className="text-3xl font-semibold tracking-tight leading-tight">
              {item.title}
            </CardTitle>
            {item.summary && (
              <p className="text-base text-muted-foreground leading-relaxed">
                {item.summary}
              </p>
            )}
          </div>

          {/* 标签 */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span key={tag} className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-lg">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6 pt-0">
          {/* Prompt 变量区域 */}
          {item.type === "prompt" ? (
            <PromptFinalPanel
              itemId={item.id}
              content={item.content}
              variables={item.variables}
              revalidatePaths={revalidatePaths}
            />
          ) : null}

          {/* Skill 来源链接 */}
          {item.type === "skill" && item.sourceUrl ? (
            <section className="rounded-2xl border border-border/60 bg-muted/30 p-5">
              <h3 className="text-sm font-semibold mb-3">来源</h3>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline break-all"
              >
                <ExternalLinkIcon className="size-4 shrink-0" />
                {item.sourceUrl}
              </a>
            </section>
          ) : null}

          {/* 原始内容 */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {item.type === "prompt" ? "原始 Prompt" : isImportedSkill ? "安装/加载提示词" : "内容"}
              </h3>
              <CopyRawButton content={copyContent} />
            </div>
            <div className="relative group">
              <pre className="overflow-x-auto rounded-2xl border border-border/60 bg-muted/30 p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
                {isImportedSkill
                  ? <>请你安装/加载这个skill：<a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{item.sourceUrl}</a></>
                  : item.content}
              </pre>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
