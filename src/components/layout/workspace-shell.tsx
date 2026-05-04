import { LogOutIcon } from "lucide-react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { GlobalSearchForm } from "@/components/layout/global-search-form";
import { MobileNav } from "@/components/layout/mobile-nav";
import { signOutAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";

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

        <div className="flex min-w-0 flex-1 flex-col lg:pl-[260px]">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur">
            <div className="relative flex h-16 items-center justify-center gap-4 px-4 lg:px-6">
              <div className="w-full max-w-xl">
                <GlobalSearchForm />
              </div>

              <div className="absolute right-4 flex items-center lg:right-6">
                <div className="hidden items-center sm:flex">
                  <form action={signOutAction}>
                    <Button type="submit" variant="ghost" size="sm" className="h-9 gap-2 rounded-xl px-3 text-muted-foreground hover:text-foreground">
                      <LogOutIcon className="size-4" />
                      <span>退出登录</span>
                    </Button>
                  </form>
                </div>
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
