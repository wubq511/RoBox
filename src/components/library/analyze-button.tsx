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
                setFeedback(payload.error ?? "Analyze failed. Retry is safe.");
                return;
              }

              setFeedback("Analyzed.");

              if (typeof window !== "undefined") {
                window.location.reload();
              }
            } catch (error) {
              setFeedback(
                error instanceof Error
                  ? error.message
                  : "Analyze failed. Retry is safe.",
              );
            }
          });
        }}
      >
        <SparklesIcon className="size-4" />
        {isPending
          ? "Analyzing"
          : isAnalyzed
            ? "Analyze again"
            : "Smart analyze"}
      </Button>
      {feedback ? (
        <span className="text-xs text-muted-foreground" role="status">
          {feedback}
        </span>
      ) : null}
    </div>
  );
}
