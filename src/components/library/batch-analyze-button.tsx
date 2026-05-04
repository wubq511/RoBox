"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ItemType } from "@/lib/schema/items";
import type { StoredItem } from "@/server/db/types";

type AnalyzeResult = {
  itemId: string;
  success: boolean;
  error?: string;
};

type BatchAnalyzeButtonProps = {
  items: StoredItem[];
  type?: ItemType;
};

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function BatchAnalyzeButton({
  items,
  type = "prompt",
}: Readonly<BatchAnalyzeButtonProps>) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();
  const router = useRouter();

  const total = items.length;
  const typeLabel = type === "prompt" ? "Prompt" : "Skill";

  const analyzeItem = async (itemId: string): Promise<AnalyzeResult> => {
    try {
      const response = await fetch(`/api/items/${itemId}/analyze`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { itemId, success: false, error: data.error || `HTTP ${response.status}` };
      }

      const data = await response.json();

      if (data.item) {
        return { itemId, success: true };
      }

      return { itemId, success: false, error: data.error || "未知错误" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "网络错误";
      return { itemId, success: false, error: message };
    }
  };

  const handleBatchAnalyze = useCallback(async () => {
    if (isRunning || total === 0) return;

    setIsRunning(true);
    setCurrentIndex(0);

    const batchResults: AnalyzeResult[] = [];

    for (let i = 0; i < total; i++) {
      setCurrentIndex(i);
      const item = items[i];

      let result = await analyzeItem(item.id);

      if (!result.success && result.error?.includes("429")) {
        await delay(5000);
        result = await analyzeItem(item.id);
      }

      batchResults.push(result);

      if (result.success) {
        router.refresh();
      }

      if (i < total - 1) {
        await delay(500);
      }
    }

    const successCount = batchResults.filter((r) => r.success).length;
    const failCount = batchResults.length - successCount;

    if (failCount === 0) {
      toast({
        title: "批量分析完成",
        description: `成功分析 ${successCount} 个 ${typeLabel}。`,
      });
    } else if (successCount === 0) {
      toast({
        title: "批量分析失败",
        description: "全部分析失败，请检查网络或稍后重试。",
        variant: "destructive",
      });
    } else {
      toast({
        title: "批量分析完成",
        description: `成功 ${successCount} 个，失败 ${failCount} 个。`,
        variant: "destructive",
      });
    }

    setIsRunning(false);
    setCurrentIndex(0);
  }, [isRunning, total, items, router, toast, typeLabel]);

  if (total === 0) {
    return (
      <Button variant="outline" disabled>
        <SparklesIcon className="size-4" />
        已全部整理
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleBatchAnalyze}
      disabled={isRunning}
    >
      {isRunning ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          分析中 {currentIndex + 1}/{total}
        </>
      ) : (
        <>
          <SparklesIcon className="size-4" />
          一键智能分析 ({total})
        </>
      )}
    </Button>
  );
}
