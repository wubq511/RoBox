"use client";

import { useState } from "react";
import { Loader2Icon, ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function GitHubImportForm({
  type = "skill",
}: Readonly<{
  type?: "skill" | "tool";
}>) {
  const [url, setUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const guidance =
    type === "tool"
      ? "粘贴 GitHub 仓库或 README 链接，自动导入内容"
      : "粘贴 GitHub 仓库、README 或 SKILL.md 链接，自动导入内容";
  const placeholder =
    type === "tool"
      ? "https://github.com/用户名/仓库"
      : "https://github.com/用户名/仓库/blob/分支/文件路径";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isImporting || !url.trim()) return;

    setIsImporting(true);
    try {
      const res = await fetch("/api/import/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast({
          title: "导入成功",
            description: `GitHub 内容已成功导入为 ${type === "tool" ? "Tool" : "Skill"}。`,
        });
        setUrl("");
      } else {
        throw new Error(data.error || "导入失败，请检查链接后重试");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "导入失败，请检查链接后重试";
      toast({
        title: "导入失败",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">
            从 GitHub 导入
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {guidance}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={placeholder}
          className="h-11 flex-1"
          disabled={isImporting}
        />
        <Button
          type="submit"
          disabled={isImporting || !url.trim()}
          className="h-11 gap-1.5 px-5"
        >
          {isImporting ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              导入中
            </>
          ) : (
            <>
              导入
              <ArrowRightIcon className="size-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
