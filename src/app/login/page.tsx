import { MailIcon, ShieldCheckIcon } from "lucide-react";
import { redirect } from "next/navigation";

import { requestMagicLinkAction } from "@/server/auth/actions";
import { getOptionalAppUser } from "@/server/auth/session";
import { hasAllowedEmails, sanitizeNextPath } from "@/server/auth/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SearchParams = Record<string, string | string[] | undefined>;

function readSearchParam(
  params: SearchParams,
  key: string,
): string | undefined {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getStatusCopy(params: SearchParams) {
  const error = readSearchParam(params, "error");

  if (error) {
    switch (error) {
      case "allowlist_not_configured":
        return "ALLOWED_EMAILS 还没有配置，登录入口已按 fail-closed 拒绝。";
      case "email_not_allowed":
        return "这个邮箱不在允许名单内。";
      case "auth_request_failed":
        return "登录链接发送失败，请检查 Supabase Auth 配置。";
      default:
        return "登录状态无效，请重新请求一次登录链接。";
    }
  }

  if (readSearchParam(params, "sent") === "1") {
    return `登录链接已发送到 ${readSearchParam(params, "email") ?? "你的邮箱"}。`;
  }

  if (readSearchParam(params, "signed_out") === "1") {
    return "当前会话已退出。";
  }

  return null;
}

export default async function LoginPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<SearchParams>;
}>) {
  const params = await searchParams;
  const nextPath = sanitizeNextPath(readSearchParam(params, "next"));
  const user = await getOptionalAppUser();

  if (user) {
    redirect(nextPath);
  }

  const statusCopy = getStatusCopy(params);
  const initialEmail = readSearchParam(params, "email") ?? "";
  const allowlistConfigured = hasAllowedEmails();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-[0_20px_60px_-42px_rgba(0,0,0,0.15)] lg:flex-row">
        {/* Left Side: Branding & Info */}
        <div className="flex flex-col justify-between bg-muted/30 p-8 lg:w-1/2 lg:p-14 lg:border-r lg:border-border/60">
          <div className="space-y-8">
            <Badge
              variant="secondary"
              className="w-fit rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/80 shadow-none border-transparent"
            >
              单用户工作台
            </Badge>
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold leading-tight tracking-tight lg:text-[2.5rem]">
                进入专属的 <br />Prompt & Skill 库
              </h1>
              <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[90%]">
                基于 Supabase Auth 的白名单保护机制。只需受信任邮箱，一键获取 Magic Link，告别繁琐密码。
              </p>
            </div>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-background border shadow-sm text-foreground">
                <MailIcon className="size-[1.125rem]" />
              </div>
              <div className="space-y-1.5 pt-0.5">
                <div className="text-sm font-semibold">Magic Link 登录</div>
                <p className="text-[13px] text-muted-foreground">
                  安全无密码认证，一次点击直接进入。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-background border shadow-sm text-foreground">
                <ShieldCheckIcon className="size-[1.125rem]" />
              </div>
              <div className="space-y-1.5 pt-0.5">
                <div className="text-sm font-semibold">白名单强校验</div>
                <p className="text-[13px] text-muted-foreground">
                  硬编码级别访问控制，彻底杜绝外人入侵。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex flex-col justify-center bg-card p-8 lg:w-1/2 lg:p-14">
          <div className="mx-auto w-full max-w-[360px] space-y-8">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-2xl font-semibold tracking-tight">登录账号</h2>
              <p className="text-[15px] text-muted-foreground">
                输入您的白名单邮箱以获取登录链接
              </p>
            </div>

            {statusCopy ? (
              <div className="rounded-[14px] border border-border/70 bg-muted/40 px-4 py-3.5 text-sm leading-6">
                {statusCopy}
              </div>
            ) : null}

            {!allowlistConfigured ? (
              <div className="rounded-[14px] border border-amber-300 bg-amber-50 px-4 py-3.5 text-sm leading-6 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200">
                `ALLOWED_EMAILS` 尚未配置，系统已执行 fail-closed 拦截。
              </div>
            ) : null}

            <form action={requestMagicLinkAction} className="space-y-5">
              <input type="hidden" name="next" value={nextPath} />
              <div className="space-y-2.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground/90">
                  邮箱地址
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={initialEmail}
                  placeholder="robert@example.com"
                  required
                  className="h-12 rounded-[14px] px-4 shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>

              <Button type="submit" size="lg" className="h-12 w-full rounded-[14px] font-medium text-[15px] shadow-sm">
                发送验证邮件
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
