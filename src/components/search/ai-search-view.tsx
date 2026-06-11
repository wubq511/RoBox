"use client";

import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  BlocksIcon,
  CircleAlertIcon,
  CheckIcon,
  ClipboardCheckIcon,
  ExternalLinkIcon,
  FileTextIcon,
  FilterIcon,
  LoaderCircleIcon,
  SearchIcon,
  SparklesIcon,
  StarIcon,
  WandSparklesIcon,
  WrenchIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  type AiSearchResponse,
  type AiSearchSelectedType,
} from "@/lib/schema/ai-search";
import type { ItemType } from "@/lib/schema/items";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type TypeOption = {
  value: AiSearchSelectedType;
  label: string;
  caption: string;
  icon: ReactNode;
};

const typeOptions: TypeOption[] = [
  {
    value: "auto",
    label: "自动",
    caption: "三类分组",
    icon: <SparklesIcon className="size-4" />,
  },
  {
    value: "prompt",
    label: "Prompt",
    caption: "提示词",
    icon: <BlocksIcon className="size-4" />,
  },
  {
    value: "skill",
    label: "Skill",
    caption: "工作流",
    icon: <WandSparklesIcon className="size-4" />,
  },
  {
    value: "tool",
    label: "Tool",
    caption: "工具",
    icon: <WrenchIcon className="size-4" />,
  },
];

const typeMeta: Record<
  ItemType,
  {
    label: string;
    hrefPrefix: string;
    icon: ReactNode;
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

function getItemHref(type: ItemType, id: string) {
  return `${typeMeta[type].hrefPrefix}/${id}`;
}

function hasAnyResults(response: AiSearchResponse) {
  return response.groups.some((group) => group.results.length > 0);
}

function getResultCount(response: AiSearchResponse) {
  return response.groups.reduce(
    (total, group) => total + group.results.length,
    0,
  );
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    return typeof payload.error === "string"
      ? payload.error
      : "AI 检索失败，请稍后重试。";
  } catch {
    return "AI 检索失败，请稍后重试。";
  }
}

export function AiSearchLoadingState() {
  return (
    <Card className="rounded-[22px] border-border/70 bg-card/95 py-0">
      <CardContent className="px-5 py-5">
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground">
            <LoaderCircleIcon className="size-4 animate-spin" />
          </span>
          <span>正在检索</span>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-foreground/70" />
        </div>
      </CardContent>
    </Card>
  );
}

export function AiSearchErrorMessage({ message }: Readonly<{ message: string }>) {
  return (
    <Card className="rounded-[22px] border-destructive/20 bg-destructive/5 py-0">
      <CardContent className="flex items-start gap-3 px-5 py-5 text-sm font-medium text-destructive">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
          <CircleAlertIcon className="size-4" />
        </span>
        <span className="leading-6">{message}</span>
      </CardContent>
    </Card>
  );
}

export function AiSearchEmptyState() {
  return (
    <Card className="rounded-[22px] border-dashed border-border/80 bg-card/80 py-0">
      <CardContent className="flex flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
            <SearchIcon className="size-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">没有匹配结果</div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              可以换一种场景描述，或把范围从单类切回自动。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AiSearchStartState() {
  return (
    <div className="rounded-[22px] border border-dashed border-border/80 bg-card/60 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
            <FileTextIcon className="size-5" />
          </span>
          <div>
            <div className="text-sm font-semibold">等待检索</div>
            <p className="mt-1 max-w-[640px] text-sm leading-6 text-muted-foreground">
              结果会按 Prompt / Skill / Tool 分组展示，并带上匹配原因、适用场景和详情入口。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground">
          {(["prompt", "skill", "tool"] as ItemType[]).map((type) => {
            const meta = typeMeta[type];

            return (
              <div
                key={type}
                className="flex min-w-[86px] items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-background px-3 py-2"
              >
                {meta.icon}
                {meta.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AiSearchResults({
  response,
}: Readonly<{
  response: AiSearchResponse;
}>) {
  if (!hasAnyResults(response)) {
    return <AiSearchEmptyState />;
  }

  const resultCount = getResultCount(response);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[22px] border border-border/70 bg-card/95 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase text-muted-foreground">
            本次检索
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-foreground">
            {response.query}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="rounded-full">
            {resultCount} 个结果
          </Badge>
          <Badge variant="outline" className="rounded-full">
            已扫描 {response.scannedCount} 个
          </Badge>
          {response.candidateLimitReached ? (
            <Badge variant="outline" className="rounded-full">
              范围已截断
            </Badge>
          ) : null}
        </div>
      </div>

      {response.groups.map((group) => {
        const meta = typeMeta[group.type];

        return (
          <Card
            key={group.type}
            className="rounded-[24px] border-border/70 bg-card/95 py-0"
          >
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <CardTitle className="flex items-center justify-between gap-4 text-lg">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/70 text-foreground">
                    {meta.icon}
                  </span>
                  {meta.label}
                </span>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  {group.results.length} 个
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-3 px-4 py-4 sm:px-5">
              {group.results.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-sm font-medium text-muted-foreground">
                  本类暂无匹配
                </div>
              ) : (
                group.results.map((result) => (
                  <article
                    key={`${result.item.type}:${result.item.id}`}
                    className="rounded-[20px] border border-border/70 bg-background p-4 shadow-[0_12px_28px_-24px_rgba(17,17,17,0.5)] transition-colors hover:border-foreground/20"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="rounded-full">
                            {meta.label}
                          </Badge>
                          <Badge variant="outline" className="rounded-full">
                            {result.item.category}
                          </Badge>
                          {result.item.isFavorite ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                              <StarIcon className="size-3" />
                              收藏
                            </span>
                          ) : null}
                          {!result.item.isAnalyzed ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                              待整理
                            </span>
                          ) : null}
                        </div>

                        <Link
                          href={getItemHref(result.item.type, result.item.id)}
                          className="group mt-3 inline-flex max-w-full items-center gap-2"
                        >
                          <h3 className="line-clamp-2 text-lg font-semibold group-hover:underline">
                            {result.item.title || "未命名内容"}
                          </h3>
                          <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                        </Link>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {result.item.summary || result.item.contentPreview}
                        </p>
                      </div>

                      <div className="w-full shrink-0 rounded-[16px] border border-border/70 bg-muted/25 p-3 lg:w-[220px]">
                        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
                          <span>匹配度</span>
                          <span className="text-foreground">{result.score}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-background">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${result.score}%` }}
                          />
                        </div>
                        <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                          <span>复制 {result.item.usageCount} 次</span>
                          <span>更新 {formatDate(result.item.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {result.item.contentPreview ? (
                      <div className="mt-4 rounded-[16px] border border-border/60 bg-muted/20 px-3 py-2.5">
                        <div className="text-xs font-semibold text-muted-foreground">
                          原文片段
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {result.item.contentPreview}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-3 border-t border-border/50 pt-4 lg:grid-cols-2">
                      <div className="rounded-[16px] bg-muted/20 p-3">
                        <div className="text-xs font-semibold text-muted-foreground">
                          匹配原因
                        </div>
                        <p className="mt-1 text-sm leading-6">{result.reason}</p>
                      </div>
                      <div className="rounded-[16px] bg-muted/20 p-3">
                        <div className="text-xs font-semibold text-muted-foreground">
                          适用场景
                        </div>
                        <p className="mt-1 text-sm leading-6">{result.useCase}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-2">
                        {result.item.tags.length > 0
                          ? result.item.tags.slice(0, 5).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground"
                              >
                                #{tag}
                              </span>
                            ))
                          : (
                              <span className="text-xs text-muted-foreground">
                                暂无标签
                              </span>
                            )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {result.item.sourceUrl ? (
                          <a
                            href={result.item.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/70 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <ExternalLinkIcon className="size-3.5" />
                            来源
                          </a>
                        ) : null}
                        <Link
                          href={getItemHref(result.item.type, result.item.id)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-2.5 text-xs font-medium text-background transition-colors hover:bg-foreground/85"
                        >
                          详情
                          <ArrowRightIcon className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

export function AiSearchView() {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] =
    useState<AiSearchSelectedType>("auto");
  const [response, setResponse] = useState<AiSearchResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const canSubmit = useMemo(() => query.trim().length >= 2, [query]);
  const selectedOption = useMemo(
    () => typeOptions.find((option) => option.value === selectedType),
    [selectedType],
  );
  const queryLength = query.trim().length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextQuery = query.trim();

    if (nextQuery.length < 2) {
      setError("检索内容至少需要 2 个字符。");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const nextResponse = await fetch("/api/search/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: nextQuery,
          type: selectedType,
        }),
      });

      if (!nextResponse.ok) {
        throw new Error(await readErrorMessage(nextResponse));
      }

      setResponse((await nextResponse.json()) as AiSearchResponse);
    } catch (searchError) {
      setResponse(null);
      setError(
        searchError instanceof Error
          ? searchError.message
          : "AI 检索失败，请稍后重试。",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 px-4 py-5 lg:px-8 lg:py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <SparklesIcon className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
              AI检索
            </h1>
            <div className="mt-1 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
              <span>自然语言</span>
              <span>/</span>
              <span>Prompt</span>
              <span>Skill</span>
              <span>Tool</span>
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Badge variant="outline" className="rounded-full">
            一次性检索
          </Badge>
          <Badge variant="secondary" className="rounded-full">
            不保存历史
          </Badge>
        </div>
      </div>

      <Card className="rounded-[24px] border-border/70 bg-card/95 py-0 shadow-sm">
        <CardContent className="p-0">
          <form
            onSubmit={handleSubmit}
            className="grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_340px]"
          >
            <div className="p-4 sm:p-5 lg:p-6">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-foreground">
                  需求
                </span>
                <Textarea
                  name="query"
                  value={query}
                  maxLength={500}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="例如：帮我找一个能把论文拆成学习笔记的 Prompt"
                  className="min-h-[168px] resize-none rounded-[18px] border-border/80 bg-muted/20 p-4 text-base leading-7 focus-visible:bg-background md:text-sm"
                />
              </label>

              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>描述工具、任务、场景或输入输出要求</span>
                <span>{queryLength}/500</span>
              </div>
            </div>

            <aside className="border-t border-border/70 bg-muted/20 p-4 sm:p-5 lg:border-l lg:border-t-0 lg:p-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FilterIcon className="size-4 text-muted-foreground" />
                类型
              </div>

              <div
                role="radiogroup"
                aria-label="AI 检索类型"
                className="mt-3 grid grid-cols-2 gap-2"
              >
                {typeOptions.map((option) => {
                  const isSelected = selectedType === option.value;

                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "relative flex min-h-[68px] cursor-pointer flex-col justify-between rounded-[16px] border border-border/70 bg-background px-3 py-3 text-sm transition-colors",
                        "hover:border-foreground/25 hover:bg-card",
                        isSelected &&
                          "border-foreground bg-card text-foreground shadow-sm ring-1 ring-foreground/10",
                      )}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={option.value}
                        checked={isSelected}
                        onChange={() => setSelectedType(option.value)}
                        className="sr-only"
                      />
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">
                          {option.icon}
                        </span>
                        {isSelected ? (
                          <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                            <CheckIcon className="size-3" />
                          </span>
                        ) : null}
                      </span>
                      <span>
                        <span className="block font-semibold">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {option.caption}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="mt-4 rounded-[16px] border border-border/70 bg-background px-3 py-3">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <ClipboardCheckIcon className="size-3.5" />
                  当前范围
                </div>
                <div className="mt-1 text-sm font-semibold">
                  {selectedOption?.label ?? "自动"}
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={!canSubmit || isLoading}
                className="mt-4 h-11 w-full gap-2 rounded-[14px] px-5"
              >
                {isLoading ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <SearchIcon className="size-4" />
                )}
                {isLoading ? "检索中" : "开始检索"}
              </Button>
            </aside>
          </form>
        </CardContent>
      </Card>

      {!isLoading && !error && !response ? <AiSearchStartState /> : null}

      {isLoading ? <AiSearchLoadingState /> : null}
      {error ? <AiSearchErrorMessage message={error} /> : null}
      {!isLoading && !error && response ? (
        <AiSearchResults response={response} />
      ) : null}
    </section>
  );
}
