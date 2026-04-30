import Link from "next/link";
import {
  ArrowRightIcon,
  CircleDashedIcon,
  CopyIcon,
  SparklesIcon,
  StarIcon,
} from "lucide-react";

import {
  getFavoriteItems,
  getPendingItems,
  getRecentItems,
  mockItems,
} from "@/features/items/mock-data";
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

const analyzeSteps = [
  "Save raw content first",
  "Generate title, summary, and tags",
  "Extract variables for prompts only",
];

export function DashboardView() {
  const pending = getPendingItems();
  const favorites = getFavoriteItems(3);
  const recent = getRecentItems(4);

  return (
    <section className="mx-auto flex w-full max-w-[1160px] flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="surface-noise rounded-[28px] border border-border/70 shadow-[0_20px_60px_-36px_rgba(17,17,17,0.32)]">
          <CardHeader className="gap-4 border-b border-border/60 pb-6">
            <Badge
              variant="outline"
              className="w-fit rounded-full border-border/80 bg-background/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
            >
              Save → Analyze → Search → Copy
            </Badge>
            <div className="space-y-3">
              <CardTitle className="max-w-3xl text-3xl leading-tight font-semibold tracking-[-0.04em] lg:text-5xl">
                Your private command shelf for prompts and skills.
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-6 text-muted-foreground lg:text-[15px]">
                RoBox 把 Prompt 与 Skill 放进同一个工作台。左边收纳，中间筛选，右边直接看变量、整理状态和复制语义。
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/prompts"
                className={cn(buttonVariants({ variant: "default", size: "lg" }))}
              >
                Browse prompts
              </Link>
              <Link
                href="/skills"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Browse skills
              </Link>
            </div>
          </CardHeader>

          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total" value={mockItems.length} detail="Prompt + Skill" />
            <MetricCard
              label="Prompts"
              value={mockItems.filter((item) => item.type === "prompt").length}
              detail="可变量化模板"
            />
            <MetricCard
              label="Skills"
              value={mockItems.filter((item) => item.type === "skill").length}
              detail="文档或 GitHub 链接"
            />
            <MetricCard label="Pending" value={pending.length} detail="待智能整理" />
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-0 bg-[#111111] text-white shadow-[0_18px_64px_-36px_rgba(0,0,0,0.72)]">
          <CardHeader className="border-b border-white/10 pb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                  DeepSeek analyze
                </p>
                <CardTitle className="mt-2 text-2xl text-white">
                  Manual trigger only
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
                Next action
              </p>
              <p className="mt-2 text-sm leading-6 text-white/80">
                先整理 {pending.length} 个未分析条目，但不覆盖用户原文。
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
                <CardTitle>Recently copied</CardTitle>
                <CardDescription>
                  这里先用静态样例模拟最近使用权重，Phase 3 再接真实 usage logs。
                </CardDescription>
              </div>
              <Link
                href="/prompts"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border/70 pt-2">
            {recent.map((item) => (
              <Link
                key={item.id}
                href={item.type === "prompt" ? "/prompts" : "/skills"}
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
            title="Favorites"
            icon={<StarIcon className="size-4" />}
            empty="暂无收藏内容"
            items={favorites.map((item) => ({
              label: item.title,
              meta: item.category,
              href: item.type === "prompt" ? "/prompts" : "/skills",
              badge: item.type,
            }))}
          />
          <MiniListCard
            title="Need analyze"
            icon={<CircleDashedIcon className="size-4" />}
            empty="当前没有待整理内容"
            items={pending.map((item) => ({
              label: item.title,
              meta: item.category,
              href: item.type === "prompt" ? "/prompts" : "/skills",
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
            <div key={item.label}>
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
