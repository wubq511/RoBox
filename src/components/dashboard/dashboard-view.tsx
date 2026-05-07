import { memo, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  CircleDashedIcon,
  CopyIcon,
  StarIcon,
  GitBranchIcon,
  SquarePenIcon,
  WrenchIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardSnapshot, StoredItem } from "@/server/db/types";

function getItemHref(item: Pick<StoredItem, "id" | "type">) {
  return item.type === "prompt"
    ? `/prompts/${item.id}`
    : item.type === "tool"
      ? `/tools/${item.id}`
      : `/skills/${item.id}`;
}

function getItemIcon(type: StoredItem["type"]) {
  if (type === "prompt") {
    return <SquarePenIcon className="size-5" />;
  }

  if (type === "tool") {
    return <WrenchIcon className="size-5" />;
  }

  return <GitBranchIcon className="size-5" />;
}

export function DashboardView({
  snapshot,
}: Readonly<{
  snapshot: DashboardSnapshot;
}>) {
  const { counts, favorites, pending, recent } = snapshot;

  const favoriteItems = useMemo(
    () =>
      favorites.map((item) => ({
        key: item.id,
        label: item.title,
        meta: item.category,
        href: getItemHref(item),
        type: item.type,
      })),
    [favorites],
  );

  const pendingItems = useMemo(
    () =>
      pending.map((item) => ({
        key: item.id,
        label: item.title,
        meta: item.category,
        href: getItemHref(item),
        type: item.type,
      })),
    [pending],
  );

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-8 lg:px-8 lg:py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <Card className="surface-noise overflow-hidden rounded-[28px] border border-border/60 shadow-[0_20px_60px_-36px_rgba(0,0,0,0.08)] transition-all">
            <CardHeader className="gap-4 border-b border-border/40 pb-4">
              <div className="space-y-3">
                <CardTitle className="max-w-3xl text-[2rem] leading-[1.15] font-semibold tracking-[-0.04em] lg:text-[2.75rem]">
                  RoBox Collection
                </CardTitle>
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
                  className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-12 rounded-[14px] px-6 text-[15px] font-medium shadow-sm")}
                >
                  新建 Skill
                </Link>
                <Link
                  href="/tools/new"
                  className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-12 rounded-[14px] px-6 text-[15px] font-medium shadow-sm")}
                >
                  新建 Tool
                </Link>
              </div>
            </CardHeader>

            <CardContent className="grid gap-4 bg-muted/20 pt-3 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard label="总计资源" value={counts.total} />
              <MetricCard label="Prompts" value={counts.prompts} />
              <MetricCard label="Skills" value={counts.skills} />
              <MetricCard label="Tools" value={counts.tools} />
              <MetricCard label="待整理" value={counts.pending} />
            </CardContent>
          </Card>

          <Card className="flex-1 rounded-[28px] border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/40 pb-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">最近使用</CardTitle>
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
                      {getItemIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-semibold text-foreground/90 group-hover:text-foreground">{item.title}</div>
                      {item.summary && (
                        <p className="truncate text-[14px] text-muted-foreground mt-0.5">
                          {item.summary}
                        </p>
                      )}
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
        </div>

        <div className="flex flex-col gap-6">
          <MiniListCard
            className="flex-1"
            title="收藏内容"
            icon={<StarIcon className="size-[18px] text-amber-500" />}
            empty="暂无收藏"
            items={favoriteItems}
            href="/favorites"
            ctaLabel="查看全部收藏"
          />
          <MiniListCard
            title="未整理草稿"
            icon={<CircleDashedIcon className="size-[18px] text-blue-500" />}
            empty="目前没有需要分析的草稿"
            items={pendingItems}
          />
        </div>
      </div>
    </section>
  );
}

const MetricCard = memo(function MetricCard({
  label,
  value,
}: Readonly<{
  label: string;
  value: number;
}>) {
  return (
    <div className="rounded-[20px] border border-border/50 bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-border/80">
      <div className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2.5 font-mono text-4xl font-bold tracking-tight text-foreground">
        {value}
      </div>
    </div>
  );
});

const MiniListCard = memo(function MiniListCard({
  title,
  icon,
  empty,
  items,
  className,
  href,
  ctaLabel,
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
  className?: string;
  href?: string;
  ctaLabel?: string;
}>) {
  const headerContent = (
    <div className="flex items-center justify-between gap-3">
      <CardTitle className="flex items-center gap-2.5 text-[16px] font-semibold">
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted/50">
          {icon}
        </div>
        <span>{title}</span>
      </CardTitle>
      {href ? (
        <span className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          全部
          <ArrowRightIcon className="size-3.5" />
        </span>
      ) : null}
    </div>
  );

  return (
    <Card className={cn("min-h-0 rounded-[24px] border-border/60 shadow-sm overflow-hidden flex flex-col", className)}>
      <CardHeader className="border-b border-border/40 pb-4 px-5">
        {href ? (
          <Link href={href} className="group -m-2 block rounded-xl p-2 transition-colors hover:bg-muted/40">
            {headerContent}
          </Link>
        ) : (
          headerContent
        )}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col pt-2 px-5 pb-5 bg-muted/10">
        {items.length === 0 ? (
          <div className="mt-3 flex flex-col items-center justify-center rounded-[16px] border border-dashed border-border/60 bg-background/50 text-center py-8">
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
                    <div className="text-[13px] text-muted-foreground mt-0.5">{item.meta || "未分类"}</div>
                  </div>
                  <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground/40 group-hover:text-foreground/80 transition-colors" />
                </Link>
              </div>
            ))}
          </div>
        )}
        {href ? (
          <Link
            href={href}
            className="mt-3 flex min-h-10 flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/40 px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-border hover:bg-background hover:text-foreground"
          >
            {ctaLabel ?? "查看全部"}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
});
