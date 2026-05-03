import Link from "next/link";
import {
  GitBranchIcon,
  LogOutIcon,
  SquarePenIcon,
} from "lucide-react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { GlobalSearchForm } from "@/components/layout/global-search-form";
import { MobileNav } from "@/components/layout/mobile-nav";
import { signOutAction } from "@/server/auth/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WorkspaceShell({
  children,
  userEmail,
}: Readonly<{
  children: React.ReactNode;
  userEmail: string;
}>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AppSidebar userEmail={userEmail} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur">
            <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                  RB
                </div>
                <div className="text-sm font-semibold">RoBox</div>
              </div>

              <GlobalSearchForm />

              <div className="hidden items-center gap-3 sm:flex">
                <div className="mr-2 max-w-[200px] truncate text-[13px] font-medium text-muted-foreground/80">
                  {userEmail}
                </div>
                <Link
                  href="/prompts/new"
                  className={cn(buttonVariants({ variant: "default", size: "sm" }), "h-9 rounded-xl px-4 font-medium shadow-sm")}
                >
                  <SquarePenIcon className="mr-2 size-4" />
                  新建 Prompt
                </Link>
                <Link
                  href="/skills/new"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 rounded-xl px-4 font-medium shadow-sm")}
                >
                  <GitBranchIcon className="mr-2 size-4" />
                  新建 Skill
                </Link>
                <form action={signOutAction}>
                  <Button type="submit" variant="ghost" size="sm" className="h-9 w-9 rounded-xl px-0 text-muted-foreground hover:text-foreground">
                    <LogOutIcon className="size-4" />
                    <span className="sr-only">退出</span>
                  </Button>
                </form>
              </div>
            </div>
            <MobileNav />
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
