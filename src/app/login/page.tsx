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
        return "Magic link 发送失败，请检查 Supabase Auth 配置。";
      default:
        return "登录状态无效，请重新请求一次 magic link。";
    }
  }

  if (readSearchParam(params, "sent") === "1") {
    return `Magic link 已发送到 ${readSearchParam(params, "email") ?? "你的邮箱"}。`;
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
    <main className="min-h-screen bg-background px-4 py-10 text-foreground lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="rounded-[32px] border-border/80 shadow-[0_20px_60px_-42px_rgba(17,17,17,0.35)]">
          <CardHeader className="gap-5 border-b border-border/70 pb-8">
            <Badge
              variant="outline"
              className="w-fit rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]"
            >
              Phase 2 foundation
            </Badge>
            <div className="space-y-3">
              <CardTitle className="max-w-2xl text-4xl leading-tight tracking-[-0.05em]">
                Sign in to your private prompt and skill shelf.
              </CardTitle>
              <CardDescription className="max-w-xl text-sm leading-6">
                RoBox 现在开始用 Supabase Auth 保护工作台，只允许白名单邮箱进入。通过邮箱 magic link 登录，不引入多余账号系统。
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="grid gap-5 pt-8 md:grid-cols-2">
            <div className="rounded-[24px] border border-border/70 bg-muted/30 p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MailIcon className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Passwordless login</div>
                  <p className="text-sm text-muted-foreground">
                    只发一封 magic link，不存本地密码。
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-muted/30 p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheckIcon className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Allowlist only</div>
                  <p className="text-sm text-muted-foreground">
                    非白名单邮箱即使拿到链接，也不会进入主应用。
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-border/80">
          <CardHeader className="gap-3 border-b border-border/70 pb-6">
            <CardTitle className="text-2xl tracking-[-0.04em]">Login</CardTitle>
            <CardDescription className="text-sm leading-6">
              输入允许邮箱，RoBox 会把你带回 {nextPath}。
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-6">
            {statusCopy ? (
              <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm leading-6">
                {statusCopy}
              </div>
            ) : null}

            {!allowlistConfigured ? (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                `ALLOWED_EMAILS` 为空。当前只允许先完成配置，再继续登录。
              </div>
            ) : null}

            <form action={requestMagicLinkAction} className="space-y-4">
              <input type="hidden" name="next" value={nextPath} />
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Allowed email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={initialEmail}
                  placeholder="robert@example.com"
                  required
                  className="h-11 rounded-xl"
                />
              </div>

              <Button type="submit" size="lg" className="w-full">
                Send magic link
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
