"use client";

import { useState, useTransition } from "react";
import { CopyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { recordCopyActionAction } from "@/server/items/actions";

type CopyRawButtonProps = {
  itemId: string;
  content: string;
  revalidatePaths: string[];
};

async function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard is not available.");
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function CopyRawButton({
  itemId,
  content,
  revalidatePaths,
}: Readonly<CopyRawButtonProps>) {
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            try {
              await copyText(content);
              const result = await recordCopyActionAction({
                itemId,
                action: "copy_raw",
                revalidatePaths,
              });

              if (result?.status === "error") {
                setFeedback(result.message);
                return;
              }

              setFeedback("Copied.");
            } catch (error) {
              setFeedback(
                error instanceof Error ? error.message : "Copy failed.",
              );
            }
          });
        }}
      >
        <CopyIcon className="size-4" />
        Copy raw
      </Button>
      {feedback ? (
        <span className="text-xs text-muted-foreground" role="status">
          {feedback}
        </span>
      ) : null}
    </div>
  );
}
