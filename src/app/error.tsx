"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-md rounded-[28px] border border-border/80 bg-card p-8 shadow-[0_20px_60px_-42px_rgba(17,17,17,0.35)]">
        <p className="text-sm font-medium text-muted-foreground">Error</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          页面出错
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          RoBox 暂时无法渲染当前页面，请重新尝试。若问题持续出现，再根据服务端日志定位。
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            {error.digest}
          </p>
        ) : null}
        <Button type="button" className="mt-6" onClick={reset}>
          重新尝试
        </Button>
      </section>
    </main>
  );
}
