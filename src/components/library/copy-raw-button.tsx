"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function CopyRawButton({
  content,
}: Readonly<{
  content: string;
}>) {
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const { toast } = useToast();

  async function handleCopy() {
    if (isCopying) return;
    setIsCopying(true);

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({
        title: "已复制",
        description: "内容已复制到剪贴板。",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "复制失败",
        description: "无法访问剪贴板，请手动复制。",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} disabled={isCopying}>
      {isCopying ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : copied ? (
        <CheckIcon className="size-4 text-green-600" />
      ) : (
        <CopyIcon className="size-4" />
      )}
    </Button>
  );
}
