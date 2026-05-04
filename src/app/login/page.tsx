import { Suspense } from "react";

import { LoginForm } from "@/components/library/login-form";
import { Loader2Icon } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">RoBox</h1>
          <p className="text-sm text-muted-foreground">登录以继续管理你的 Prompt 与 Skill</p>
        </div>
        <Suspense
          fallback={
            <div className="flex justify-center py-4">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
