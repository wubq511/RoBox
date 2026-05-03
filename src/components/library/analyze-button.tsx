"use client";

import { useState, useTransition } from "react";
import { SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type AnalyzeButtonProps = {
  itemId: string;
  isAnalyzed: boolean;
};

export function AnalyzeButton({
  itemId,
  isAnalyzed,
}: Readonly<AnalyzeButtonProps>) {
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={isAnalyzed ? "outline" : "default"}
        size="sm"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            setFeedback("");

            try {
              const response = await fetch(
                `/api/items/${encodeURIComponent(itemId)}/analyze`,
                {
                  method: "POST",
                },
              );
              const payload = (await response.json().catch(() => ({}))) as {
                error?: string;
              };

              if (!response.ok) {
                setFeedback(payload.error ?? "分析失败，可安全重试");
                return;
              }

              setFeedback("分析完成");

              if (typeof window !== "undefined") {
                window.location.reload();
              }
            } catch (error) {
              setFeedback(
                error instanceof Error
                  ? error.message
                  : "分析失败，可安全重试",
              );
            }
          });
        }}
      >
        <SparklesIcon className="size-4" />
        {isPending
          ? "分析中"
          : isAnalyzed
            ? "重新分析"
            : "智能分析"}
      </Button>
      {feedback ? (
        <span className="text-xs text-muted-foreground" role="status">
          {feedback}
        </span>
      ) : null}
    </div>
  );
}
