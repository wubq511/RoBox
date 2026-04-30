import {
  CircleDashedIcon,
  CopyIcon,
  SparklesIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";

import { getItemsByType, mockItems } from "@/features/items/mock-data";
import { itemCategories, type ItemType } from "@/features/items/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function LibraryView({ type }: Readonly<{ type: ItemType }>) {
  const items = getItemsByType(type);
  const highlighted = items[0];
  const totalCount = mockItems.length;

  return (
    <section className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <Card className="rounded-[28px] border-border/70">
            <CardHeader className="gap-4 border-b border-border/70 pb-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <CardTitle className="text-3xl tracking-[-0.04em]">
                    {type === "prompt" ? "Prompt library" : "Skill library"}
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm leading-6">
                    {type === "prompt"
                      ? "变量填写、最终 Prompt 预览、一键复制。"
                      : "保存 SKILL.md、子 skill 或 GitHub 链接。"}
                  </CardDescription>
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {items.length} matched / {totalCount} total
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {itemCategories.map((category) => (
                  <Badge
                    key={category}
                    variant={category === highlighted.category ? "default" : "outline"}
                    className="rounded-full px-3 py-1"
                  >
                    {category}
                  </Badge>
                ))}
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  ★ Favorite
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  ✦ Need analyze
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="grid gap-4 pt-5">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[24px] border border-border/70 bg-background/90 p-5 shadow-[0_10px_24px_-22px_rgba(17,17,17,0.35)]"
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
                      <Badge
                        key={tag}
                        variant="outline"
                        className="rounded-full px-2.5"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      Copied {item.usageCount}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" disabled>
                        <SparklesIcon className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" disabled>
                        <StarIcon className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" disabled>
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-[88px] xl:self-start">
          <Card className="rounded-[28px] border-border/70">
            <CardHeader className="gap-4 border-b border-border/70 pb-5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="rounded-full px-2.5">
                  {highlighted.type}
                </Badge>
                <Button variant="ghost" size="icon-sm" disabled>
                  <CircleDashedIcon className="size-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl tracking-[-0.03em]">
                  {highlighted.title}
                </CardTitle>
                <CardDescription className="text-sm leading-6">
                  {highlighted.summary}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full px-2.5">
                  {highlighted.category}
                </Badge>
                {highlighted.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="rounded-full px-2.5">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-5">
              {type === "prompt" ? (
                <>
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Variables</h3>
                      <span className="font-mono text-xs text-muted-foreground">
                        {highlighted.variables.length}
                      </span>
                    </div>
                    {highlighted.variables.length > 0 ? (
                      highlighted.variables.map((variable) => (
                        <div
                          key={variable.name}
                          className="rounded-2xl border border-border/70 bg-muted/40 p-4"
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
                          <p className="mt-2 text-sm text-muted-foreground">
                            {variable.description}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                        没有识别到变量。仍可复制原始 Prompt。
                      </div>
                    )}
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Final prompt preview</h3>
                      <Button variant="outline" size="sm" disabled>
                        <CopyIcon className="size-4" />
                        Copy final
                      </Button>
                    </div>
                    <pre className="overflow-x-auto rounded-[22px] border border-border/70 bg-muted/30 p-4 font-mono text-xs leading-6 whitespace-pre-wrap text-muted-foreground">
                      {highlighted.content}
                    </pre>
                  </section>
                </>
              ) : (
                <>
                  <section className="rounded-[22px] border border-border/70 bg-muted/30 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Use case
                    </p>
                    <p className="mt-3 text-sm leading-6 text-foreground">
                      保存可复制使用的 Skill 文档或 GitHub 链接。GitHub 导入型 Skill 第一版只展示仓库链接和摘要，不抓取任意网页。
                    </p>
                  </section>
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Skill source</h3>
                      <span className="text-xs text-muted-foreground">
                        {highlighted.sourceUrl ? "GitHub" : "Raw"}
                      </span>
                    </div>
                    <pre className="overflow-x-auto rounded-[22px] border border-border/70 bg-muted/30 p-4 font-mono text-xs leading-6 whitespace-pre-wrap text-muted-foreground">
                      {highlighted.sourceUrl || highlighted.content}
                    </pre>
                  </section>
                </>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </section>
  );
}
