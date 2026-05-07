"use client";

import { useState } from "react";
import { ArrowRightIcon, GlobeIcon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function WebImportForm() {
  const [url, setUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isImporting || !url.trim()) return;

    setIsImporting(true);
    try {
      const res = await fetch("/api/import/web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast({
          title: "导入成功",
          description: "网站内容已成功导入为 Tool。",
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
          <GlobeIcon className="size-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">
            从网站导入
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            粘贴公共 HTTPS 工具网站，自动抓取页面文本整理为 Tool
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
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
