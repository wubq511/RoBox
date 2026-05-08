"use client";

import { type FormEvent, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

function resolveActionPath(pathname: string) {
  if (pathname.startsWith("/skills")) {
    return "/skills";
  }

  if (pathname.startsWith("/prompts")) {
    return "/prompts";
  }

  if (pathname.startsWith("/tools")) {
    return "/tools";
  }

  return "/prompts";
}

export function GlobalSearchForm() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionPath = resolveActionPath(pathname);
  const query = searchParams.get("search") ?? "";
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const search = String(formData.get("search") ?? "").trim();
      const params = new URLSearchParams();

      if (search) {
        params.set("search", search);
      }

      const nextPath = params.toString()
        ? `${actionPath}?${params.toString()}`
        : actionPath;

      router.push(nextPath);
    },
    [actionPath, router],
  );

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        key={`${actionPath}:${query}`}
        aria-label="搜索库内容"
        name="search"
        defaultValue={query}
        placeholder="搜索标题、标签或原文"
        className="h-10 rounded-xl bg-muted/50 pl-10"
      />
    </form>
  );
}
