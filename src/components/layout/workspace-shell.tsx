import Link from "next/link";
import { GitBranchIcon, SearchIcon, SquarePenIcon } from "lucide-react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WorkspaceShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur">
            <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                  RB
                </div>
                <div className="text-sm font-semibold">RoBox</div>
              </div>

              <div className="relative ml-auto w-full max-w-xl lg:ml-0">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search library"
                  placeholder="Search titles, tags, or raw content"
                  className="h-10 rounded-xl bg-muted/50 pl-10"
                />
              </div>

              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/prompts"
                  className={cn(buttonVariants({ variant: "default", size: "lg" }))}
                >
                  <SquarePenIcon className="size-4" />
                  Quick add
                </Link>
                <Link
                  href="/skills"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  <GitBranchIcon className="size-4" />
                  GitHub import
                </Link>
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
