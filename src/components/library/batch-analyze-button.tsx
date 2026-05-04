"use client";

import { useState, useCallback, useRef } from "react";
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

const CONCURRENCY = 3;

async function analyzeItem(itemId: string): Promise<AnalyzeResult> {
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
}

export function BatchAnalyzeButton({
  items,
  type = "prompt",
}: Readonly<BatchAnalyzeButtonProps>) {
  const [isRunning, setIsRunning] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const { toast } = useToast();
  const router = useRouter();
  const abortRef = useRef(false);

  const total = items.length;
  const typeLabel = type === "prompt" ? "Prompt" : "Skill";

  const handleBatchAnalyze = useCallback(async () => {
    if (isRunning || total === 0) return;

    setIsRunning(true);
    setCompletedCount(0);
    abortRef.current = false;

    const results: AnalyzeResult[] = [];
    let index = 0;

    async function runNext(): Promise<void> {
      while (index < total && !abortRef.current) {
        const currentIndex = index++;
        const item = items[currentIndex];

        let result = await analyzeItem(item.id);

        if (!result.success && result.error?.includes("429")) {
          await new Promise<void>((resolve) => setTimeout(resolve, 5000));
          if (!abortRef.current) {
            result = await analyzeItem(item.id);
          }
        }

        results.push(result);
        setCompletedCount(results.length);
      }
    }

    const workers = Array.from(
      { length: Math.min(CONCURRENCY, total) },
      () => runNext(),
    );

    await Promise.all(workers);

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    if (successCount > 0) {
      router.refresh();
    }

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
    setCompletedCount(0);
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
          分析中 {completedCount}/{total}
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
