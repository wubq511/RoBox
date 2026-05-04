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
    <aside className="fixed left-0 top-0 hidden h-screen w-[260px] flex-col overflow-y-auto border-r border-border/60 bg-sidebar lg:flex">
      <div className="flex h-[60px] items-center gap-3 px-6">
        <div className="flex size-[34px] items-center justify-center rounded-xl bg-primary text-[13px] font-bold text-primary-foreground shadow-sm">
          RB
        </div>
        <div className="space-y-0.5">
          <div className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">RoBox</div>
          <p className="text-xs font-medium text-sidebar-foreground/60 tracking-wider uppercase">
            Prompt / Skill 库
          </p>
        </div>
      </div>

      <nav className="grid gap-1 px-3 pt-4 pb-6">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] font-medium transition-all duration-200",
                active 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn(
                "size-[18px] transition-colors", 
                active ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
              )} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4 pb-6">
        <div className="rounded-[14px] border border-border/50 bg-background/50 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              当前账号
            </h2>
          </div>

          <p className="text-[13px] font-medium truncate text-muted-foreground/80">
            {userEmail}
          </p>
        </div>
      </div>
    </aside>
  );
}
