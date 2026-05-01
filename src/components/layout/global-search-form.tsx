"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

function resolveActionPath(pathname: string) {
  if (pathname.startsWith("/skills")) {
    return "/skills";
  }

  if (pathname.startsWith("/prompts")) {
    return "/prompts";
  }

  return "/prompts";
}

export function GlobalSearchForm() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const actionPath = resolveActionPath(pathname);
  const query = searchParams.get("search") ?? "";

  return (
    <form action={actionPath} className="relative ml-auto w-full max-w-xl lg:ml-0">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        key={`${actionPath}:${query}`}
        aria-label="Search library"
        name="search"
        defaultValue={query}
        placeholder="Search titles, tags, or raw content"
        className="h-10 rounded-xl bg-muted/50 pl-10"
      />
    </form>
  );
}
