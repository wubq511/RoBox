"use client";

import { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  BlocksIcon,
  CircleAlertIcon,
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
};

const typeOptions: TypeOption[] = [
  { value: "auto", label: "自动" },
  { value: "prompt", label: "Prompt" },
  { value: "skill", label: "Skill" },
  { value: "tool", label: "Tool" },
];

const typeMeta: Record<
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

function getItemHref(type: ItemType, id: string) {
  return `${typeMeta[type].hrefPrefix}/${id}`;
}

function hasAnyResults(response: AiSearchResponse) {
  return response.groups.some((group) => group.results.length > 0);
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
    <Card className="rounded-[24px] border-border/70">
      <CardContent className="flex items-center gap-3 px-5 py-5 text-sm font-medium text-muted-foreground">
        <LoaderCircleIcon className="size-4 animate-spin" />
        正在检索
      </CardContent>
    </Card>
  );
}

export function AiSearchErrorMessage({ message }: Readonly<{ message: string }>) {
  return (
    <Card className="rounded-[24px] border-destructive/20 bg-destructive/5">
      <CardContent className="flex items-center gap-3 px-5 py-5 text-sm font-medium text-destructive">
        <CircleAlertIcon className="size-4" />
        {message}
      </CardContent>
    </Card>
  );
}

export function AiSearchEmptyState() {
  return (
    <Card className="rounded-[24px] border-border/70">
      <CardContent className="flex items-center gap-3 px-5 py-5 text-sm font-medium text-muted-foreground">
        <SearchIcon className="size-4" />
        没有匹配结果
      </CardContent>
    </Card>
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

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary" className="rounded-full">
          已扫描 {response.scannedCount} 个
        </Badge>
        {response.candidateLimitReached ? (
          <Badge variant="outline" className="rounded-full">
            范围已截断
          </Badge>
        ) : null}
      </div>

      {response.groups.map((group) => {
        const meta = typeMeta[group.type];

        return (
          <Card key={group.type} className="rounded-[28px] border-border/70">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="flex items-center justify-between gap-4 text-xl">
                <span className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-muted/60 text-foreground">
                    {meta.icon}
                  </span>
                  {meta.label}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {group.results.length} 个
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-3 pt-4">
              {group.results.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-sm font-medium text-muted-foreground">
                  本类暂无匹配
                </div>
              ) : (
                group.results.map((result) => (
                  <article
                    key={`${result.item.type}:${result.item.id}`}
                    className="rounded-[20px] border border-border/70 bg-background/90 p-4 shadow-[0_10px_24px_-22px_rgba(17,17,17,0.35)]"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
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
                          <h3 className="truncate text-lg font-semibold tracking-[-0.02em] group-hover:underline">
                            {result.item.title || "未命名内容"}
                          </h3>
                          <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                        </Link>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {result.item.summary || result.item.contentPreview}
                        </p>
                      </div>

                      <div className="w-full shrink-0 rounded-[16px] border border-border/70 bg-muted/20 p-3 lg:w-[220px]">
                        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                          <span>匹配度 {result.score}</span>
                          <span>{formatDate(result.item.updatedAt)}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-background">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${result.score}%` }}
                          />
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground">
                          复制 {result.item.usageCount} 次
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 border-t border-border/50 pt-4 lg:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">
                          匹配原因
                        </div>
                        <p className="mt-1 text-sm leading-6">{result.reason}</p>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">
                          适用场景
                        </div>
                        <p className="mt-1 text-sm leading-6">{result.useCase}</p>
                      </div>
                    </div>

                    {result.item.tags.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {result.item.tags.slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
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
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-6 lg:px-8 lg:py-8">
      <Card className="rounded-[28px] border-border/70">
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle className="flex items-center gap-3 text-3xl tracking-[-0.04em]">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <SparklesIcon className="size-5" />
            </span>
            AI检索
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <label className="grid gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  需求
                </span>
                <Textarea
                  name="query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="例如：帮我找一个能把论文拆成学习笔记的 Prompt"
                  className="min-h-[112px] rounded-[18px] bg-background"
                />
              </label>

              <div className="grid gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  类型
                </span>
                <div
                  role="radiogroup"
                  aria-label="AI 检索类型"
                  className="grid grid-cols-4 gap-1 rounded-[16px] border border-border/70 bg-muted/30 p-1 lg:w-[360px]"
                >
                  {typeOptions.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "flex h-10 cursor-pointer items-center justify-center rounded-[12px] px-3 text-sm font-medium text-muted-foreground transition-colors",
                        selectedType === option.value &&
                          "bg-background text-foreground shadow-sm",
                      )}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={option.value}
                        checked={selectedType === option.value}
                        onChange={() => setSelectedType(option.value)}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={!canSubmit || isLoading}
                className="h-11 gap-2 rounded-[14px] px-5"
              >
                {isLoading ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <SearchIcon className="size-4" />
                )}
                {isLoading ? "检索中" : "开始检索"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? <AiSearchLoadingState /> : null}
      {error ? <AiSearchErrorMessage message={error} /> : null}
      {!isLoading && !error && response ? (
        <AiSearchResults response={response} />
      ) : null}
    </section>
  );
}
