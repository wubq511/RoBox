import { Suspense } from "react";

import { LoginForm } from "@/components/library/login-form";
import { Loader2Icon } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />
      <div className="relative w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 backdrop-blur-xl">
          <div className="flex flex-col items-center space-y-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <rect
                  x="2"
                  y="2"
                  width="20"
                  height="20"
                  rx="5"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M7 17L17 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="space-y-2 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white">
                RoBox
              </h1>
              <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
                管理你的 Prompt 与 Skill
              </p>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-8">
            <Suspense
              fallback={
                <div className="flex justify-center py-4">
                  <Loader2Icon className="size-6 animate-spin text-slate-400" />
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
