import Link from "next/link";
import {
  ArrowRightIcon,
  CircleDashedIcon,
  CopyIcon,
  SparklesIcon,
  StarIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardSnapshot, StoredItem } from "@/server/db/types";

const analyzeSteps = [
  "先保存原始内容",
  "生成标题、摘要和标签",
  "仅为 Prompt 提取变量",
];

function getItemHref(item: Pick<StoredItem, "id" | "type">) {
  return item.type === "prompt" ? `/prompts/${item.id}` : `/skills/${item.id}`;
}

export function DashboardView({
  snapshot,
}: Readonly<{
  snapshot: DashboardSnapshot;
}>) {
  const { counts, favorites, pending, recent } = snapshot;

  return (
    <section className="mx-auto flex w-full max-w-[1160px] flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="surface-noise rounded-[28px] border border-border/70 shadow-[0_20px_60px_-36px_rgba(17,17,17,0.32)]">
          <CardHeader className="gap-4 border-b border-border/60 pb-6">
            <Badge
              variant="outline"
              className="w-fit rounded-full border-border/80 bg-background/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
            >
              保存 -&gt; 搜索 -&gt; 打开 -&gt; 复制
            </Badge>
            <div className="space-y-3">
              <CardTitle className="max-w-3xl text-3xl leading-tight font-semibold tracking-[-0.04em] lg:text-5xl">
                你的个人 Prompt 与 Skill 工作台。
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-6 text-muted-foreground lg:text-[15px]">
                搜索入口在顶栏，下面聚合最近使用、收藏、待整理与数量统计。
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/prompts/new"
                className={cn(buttonVariants({ variant: "default", size: "lg" }))}
              >
                新建 Prompt
              </Link>
              <Link
                href="/skills/new"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                新建 Skill
              </Link>
            </div>
          </CardHeader>

          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="总数" value={counts.total} detail="Prompt + Skill" />
            <MetricCard label="Prompt" value={counts.prompts} detail="可变量化模板" />
            <MetricCard label="Skill" value={counts.skills} detail="可复制 Skill 原文" />
            <MetricCard label="待整理" value={counts.pending} detail="待智能整理" />
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-0 bg-[#111111] text-white shadow-[0_18px_64px_-36px_rgba(0,0,0,0.72)]">
          <CardHeader className="border-b border-white/10 pb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                  DeepSeek 整理
                </p>
                <CardTitle className="mt-2 text-2xl text-white">
                  仅手动触发
                </CardTitle>
              </div>
              <SparklesIcon className="size-5 text-amber-300" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {analyzeSteps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-black">
                  {index + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                下一步
              </p>
              <p className="mt-2 text-sm leading-6 text-white/80">
                先整理 {counts.pending} 个未分析条目，但不覆盖用户原文。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-[28px] border-border/70">
          <CardHeader className="border-b border-border/70 pb-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <CardTitle>最近复制</CardTitle>
                <CardDescription>
                  这里展示真实 `usage_logs` 计数驱动的最近使用条目。
                </CardDescription>
              </div>
              <Link
                href="/prompts"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                查看全部
              </Link>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border/70 pt-2">
            {recent.map((item) => (
              <Link
                key={item.id}
                href={getItemHref(item)}
                className="flex items-center gap-4 py-4 transition-colors hover:text-foreground"
              >
                <Badge variant="outline" className="rounded-full px-2.5">
                  {item.type}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{item.title}</div>
                  <p className="truncate text-sm text-muted-foreground">
                    {item.summary}
                  </p>
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {item.usageCount}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <MiniListCard
            title="收藏"
            icon={<StarIcon className="size-4" />}
            empty="暂无收藏内容"
            items={favorites.map((item) => ({
              key: item.id,
              label: item.title,
              meta: item.category,
              href: getItemHref(item),
              badge: item.type,
            }))}
          />
          <MiniListCard
            title="待整理"
            icon={<CircleDashedIcon className="size-4" />}
            empty="当前没有待整理内容"
            items={pending.map((item) => ({
              key: item.id,
              label: item.title,
              meta: item.category,
              href: getItemHref(item),
              badge: item.type,
            }))}
          />
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: Readonly<{
  label: string;
  value: number;
  detail: string;
}>) {
  return (
    <div className="rounded-[22px] border border-border/70 bg-background/90 p-5 shadow-[0_12px_32px_-28px_rgba(17,17,17,0.35)]">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 font-mono text-3xl font-semibold tracking-[-0.04em]">
        {value}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function MiniListCard({
  title,
  icon,
  empty,
  items,
}: Readonly<{
  title: string;
  icon: React.ReactNode;
  empty: string;
  items: Array<{
    key: string;
    label: string;
    meta: string;
    href: string;
    badge: string;
  }>;
}>) {
  return (
    <Card className="rounded-[28px] border-border/70">
      <CardHeader className="border-b border-border/70 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            {icon}
            <span>{title}</span>
          </CardTitle>
          <CopyIcon className="size-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-muted/60 px-4 py-6 text-sm text-muted-foreground">
            {empty}
          </div>
        ) : (
          items.map((item, index) => (
            <div key={item.key}>
              {index > 0 ? <Separator className="my-3" /> : null}
              <Link
                href={item.href}
                className="flex items-center gap-3 py-1.5 transition-colors hover:text-foreground"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.meta}</div>
                </div>
                <Badge variant="outline" className="rounded-full px-2.5">
                  {item.badge}
                </Badge>
                <ArrowRightIcon className="size-4 text-muted-foreground" />
              </Link>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
