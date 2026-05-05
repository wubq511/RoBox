"use client";

import { useState, useRef } from "react";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestMagicLinkAction } from "@/server/auth/actions";

export function LoginForm() {
  const [isPending, setIsPending] = useState(false);
  const [isGitHubPending, setIsGitHubPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    try {
      await requestMagicLinkAction(formData);
    } catch (e) {
      if (e instanceof Error && e.message !== "NEXT_REDIRECT") {
        setError("发送失败，请稍后重试");
        setIsPending(false);
      }
    }
  }

  function handleGitHubClick() {
    setIsGitHubPending(true);
  }

  return (
    <div className="space-y-5">
      <a
        href="/auth/github"
        onClick={handleGitHubClick}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-slate-200 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
        aria-disabled={isGitHubPending}
      >
        {isGitHubPending ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        )}
        {isGitHubPending ? "登录中" : "GitHub 登录"}
      </a>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
          或
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form
        ref={formRef}
        action={handleSubmit}
        className="space-y-5"
      >
        <label className="block space-y-4">
          <span className="text-sm font-semibold uppercase tracking-widest text-white">
            邮箱
          </span>
          <Input
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            disabled={isPending}
            className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-white/20"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-slate-200 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
        >
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : null}
          {isPending ? "发送中" : "发送登录链接"}
        </button>
      </form>

      {error ? (
        <p className="text-center text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
