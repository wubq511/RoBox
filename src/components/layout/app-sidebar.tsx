"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function isActive(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ userEmail }: Readonly<{ userEmail: string }>) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[248px] shrink-0 border-r border-border/80 bg-sidebar lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-border/70 px-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
          RB
        </div>
        <div className="space-y-0.5">
          <div className="text-sm font-semibold">RoBox</div>
          <p className="text-xs text-muted-foreground">
            Prompt / Skill library
          </p>
        </div>
      </div>

      <nav className="grid gap-1 px-3 py-5">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                isActive(item.href, pathname) &&
                  "bg-sidebar-accent text-sidebar-foreground"
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-5 px-5 pb-5">
        <div className="space-y-3 border-t border-border/70 pt-5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Library health</span>
            <span className="text-emerald-600">OK</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-border">
            <div className="h-full w-[72%] rounded-full bg-primary" />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Coverage</span>
            <span>72%</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-background/90 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Phase 2
          </h2>
          <p className="mt-2 text-sm text-foreground">
            Auth、allowlist 和数据库底座已接入，库体验和真实 CRUD 在下一阶段接上。
          </p>
          <p className="mt-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">
            Signed in as {userEmail}
          </p>
        </div>
      </div>
    </aside>
  );
}
