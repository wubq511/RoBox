import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-md rounded-[28px] border border-border/80 bg-card p-8 shadow-[0_20px_60px_-42px_rgba(17,17,17,0.35)]">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          页面不存在
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          这个地址没有对应的 RoBox 页面，返回工作台继续管理 Prompt 与 Skill。
        </p>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "default" }), "mt-6")}
        >
          返回工作台
        </Link>
      </section>
    </main>
  );
}
