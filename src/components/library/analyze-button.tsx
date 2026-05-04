"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function AnalyzeButton({ itemId }: Readonly<{ itemId: string }>) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleAnalyze() {
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      const response = await fetch(`/api/items/${itemId}/analyze`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "智能分析失败，请稍后重试");
      }

      const data = await response.json();

      if (data.item) {
        toast({
          title: "分析完成",
          description: "已自动更新标题、摘要和标签。",
        });
        router.refresh();
      } else {
        throw new Error(data.error || "智能分析失败，请稍后重试");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "智能分析失败，请稍后重试";
      toast({
        title: "分析失败",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <Button
      variant="secondary"
      onClick={handleAnalyze}
      disabled={isAnalyzing}
    >
      {isAnalyzing ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          分析中
        </>
      ) : (
        <>
          <SparklesIcon className="size-4" />
          智能分析
        </>
      )}
    </Button>
  );
}
