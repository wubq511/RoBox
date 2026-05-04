"use client";

import { useState, useRef } from "react";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestMagicLinkAction } from "@/server/auth/actions";

export function LoginForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    try {
      await requestMagicLinkAction(formData);
    } catch (e) {
      // Server action redirect 会抛出 NEXT_REDIRECT 错误，这是正常的
      // 真正的错误才会走到这里
      if (e instanceof Error && e.message !== "NEXT_REDIRECT") {
        setError("发送失败，请稍后重试");
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="space-y-4"
    >
      <label className="space-y-2">
        <span className="text-sm font-medium">邮箱</span>
        <Input
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          disabled={isPending}
        />
      </label>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            发送中
          </>
        ) : (
          "发送登录链接"
        )}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
