import Link from "next/link";
import {
  ArrowRightIcon,
  CircleDashedIcon,
  CopyIcon,
  SparklesIcon,
  StarIcon,
  GitBranchIcon,
  SquarePenIcon,
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
    <section className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-8 lg:px-8 lg:py-10">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="surface-noise overflow-hidden rounded-[28px] border border-border/60 shadow-[0_20px_60px_-36px_rgba(0,0,0,0.08)] transition-all">
          <CardHeader className="gap-5 border-b border-border/40 pb-8">
            <Badge
              variant="secondary"
              className="w-fit rounded-full bg-primary/5 text-primary border-primary/20 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
            >
              工作流: 保存 → 搜索 → 复制
            </Badge>
            <div className="space-y-4">
              <CardTitle className="max-w-3xl text-[2rem] leading-[1.15] font-semibold tracking-[-0.04em] lg:text-[2.75rem]">
                RoBox 个人工作台
              </CardTitle>
              <CardDescription className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground/80">
                你的专属 Prompt 与 Skill 知识库。聚合最近使用、收藏标记与待智能整理内容。
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/prompts/new"
                className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-12 rounded-[14px] px-6 text-[15px] font-medium shadow-sm")}
              >
                新建 Prompt
              </Link>
              <Link
                href="/skills/new"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 rounded-[14px] px-6 text-[15px] font-medium shadow-sm bg-background/50 hover:bg-background")}
              >
                新建 Skill
              </Link>
            </div>
          </CardHeader>

          <CardContent className="grid gap-4 bg-muted/20 pt-8 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="总计资源" value={counts.total} detail="Prompt & Skill" />
            <MetricCard label="Prompts" value={counts.prompts} detail="包含变量配置" />
            <MetricCard label="Skills" value={counts.skills} detail="Cursor/Claude 规则" />
            <MetricCard label="待整理" value={counts.pending} detail="需要 AI 归档" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-[28px] border-0 bg-slate-950 text-white shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-transparent mix-blend-overlay"></div>
          <CardHeader className="relative border-b border-white/10 pb-6 z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-300">
                  AI 智能整理
                </p>
                <CardTitle className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  结构化归档
                </CardTitle>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                <SparklesIcon className="size-5 text-indigo-300" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-4 pt-6 z-10">
            {analyzeSteps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 px-4 py-3.5 text-[14px] font-medium backdrop-blur-sm"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/30 text-[13px] font-bold text-indigo-200">
                  {index + 1}
                </span>
                <span className="text-white/90">{step}</span>
              </div>
            ))}

            <div className="mt-6 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)] animate-pulse"></div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-300">
                  系统状态
                </p>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-indigo-100/80">
                有 {counts.pending} 个草稿等待分析。原文本安全隔离，不会被覆写。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="rounded-[28px] border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-5">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle className="text-xl">最近使用</CardTitle>
                <CardDescription className="text-[14px]">
                  根据使用频次自动排行的资源。
                </CardDescription>
              </div>
              <Link
                href="/prompts"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-9 rounded-xl font-medium")}
              >
                浏览全部
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-2 px-6 pb-6">
            <div className="divide-y divide-border/40">
              {recent.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">暂无使用记录</div>
              ) : recent.map((item) => (
                <Link
                  key={item.id}
                  href={getItemHref(item)}
                  className="group flex items-center gap-5 py-4 transition-all hover:bg-muted/30 -mx-4 px-4 rounded-2xl"
                >
                  <div className="flex size-[42px] shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background shadow-sm group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                    {item.type === "prompt" ? <SquarePenIcon className="size-5" /> : <GitBranchIcon className="size-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold text-foreground/90 group-hover:text-foreground">{item.title}</div>
                    <p className="truncate text-[14px] text-muted-foreground mt-0.5">
                      {item.summary || "无摘要"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-[13px] font-medium text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <CopyIcon className="size-3.5" />
                    <span>{item.usageCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <MiniListCard
            title="收藏内容"
            icon={<StarIcon className="size-[18px] text-amber-500" />}
            empty="暂无加星收藏的条目"
            items={favorites.map((item) => ({
              key: item.id,
              label: item.title,
              meta: item.category,
              href: getItemHref(item),
              type: item.type,
            }))}
          />
          <MiniListCard
            title="未整理草稿"
            icon={<CircleDashedIcon className="size-[18px] text-blue-500" />}
            empty="目前没有需要分析的草稿"
            items={pending.map((item) => ({
              key: item.id,
              label: item.title,
              meta: item.category,
              href: getItemHref(item),
              type: item.type,
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
    <div className="rounded-[20px] border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-border/80">
      <div className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-3 font-mono text-4xl font-bold tracking-tight text-foreground">
        {value}
      </div>
      <p className="mt-2 text-[13px] font-medium text-muted-foreground/80">{detail}</p>
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
    type: string;
  }>;
}>) {
  return (
    <Card className="rounded-[24px] border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="border-b border-border/40 pb-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 text-[16px] font-semibold">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted/50">
              {icon}
            </div>
            <span>{title}</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-2 px-5 pb-5 bg-muted/10">
        {items.length === 0 ? (
          <div className="mt-3 flex flex-col items-center justify-center rounded-[16px] border border-dashed border-border/60 bg-background/50 py-8 text-center">
            <div className="text-[14px] font-medium text-muted-foreground">{empty}</div>
          </div>
        ) : (
          <div className="divide-y divide-border/40 mt-1">
            {items.map((item) => (
              <div key={item.key} className="py-1">
                <Link
                  href={item.href}
                  className="group flex items-center gap-4 rounded-xl py-3 px-3 transition-colors hover:bg-background shadow-sm border border-transparent hover:border-border/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold text-foreground/90 group-hover:text-foreground">{item.label}</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">{item.meta || "未分类"}</div>
                  </div>
                  <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground/40 group-hover:text-foreground/80 transition-colors" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
