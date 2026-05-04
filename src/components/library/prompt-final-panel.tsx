"use client";

import { useMemo, useState, useTransition } from "react";
import { CopyIcon, CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildFinalPrompt } from "@/features/items/final-prompt";
import type { StoredPromptVariable } from "@/server/db/types";
import { recordCopyActionAction } from "@/server/items/actions";

import { copyText } from "./clipboard";

type PromptFinalPanelProps = {
  itemId: string;
  content: string;
  variables: StoredPromptVariable[];
  revalidatePaths: string[];
};

export function PromptFinalPanel({
  itemId,
  content,
  variables,
  revalidatePaths,
}: Readonly<PromptFinalPanelProps>) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      variables.map((variable) => [variable.name, variable.defaultValue ?? ""]),
    ),
  );
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const finalPrompt = useMemo(
    () => buildFinalPrompt(content, values, variables),
    [content, values, variables],
  );

  const handleCopy = () => {
    startTransition(async () => {
      try {
        await copyText(finalPrompt);
        const result = await recordCopyActionAction({
          itemId,
          action: "copy_final",
          revalidatePaths,
        });

        if (result?.status === "error") {
          setFeedback(result.message);
          return;
        }

        setFeedback("已复制");
        setTimeout(() => setFeedback(""), 2000);
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "复制失败");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 变量区域 */}
      {variables.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">变量</h3>
            <span className="text-xs text-muted-foreground">
              {variables.length} 个
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {variables.map((variable) => (
              <div
                key={variable.name}
                className="space-y-2 rounded-xl border border-border/60 bg-background p-4 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 transition-all"
              >
                <label
                  htmlFor={`var-${variable.name}`}
                  className="text-sm font-medium"
                >
                  {variable.name}
                  {variable.required && (
                    <span className="text-destructive">*</span>
                  )}
                </label>
                <Input
                  id={`var-${variable.name}`}
                  value={values[variable.name] ?? ""}
                  placeholder={variable.defaultValue || variable.description || "请输入..."}
                  className="h-9 text-sm"
                  onChange={(event) => {
                    setValues((currentValues) => ({
                      ...currentValues,
                      [variable.name]: event.target.value,
                    }));
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 最终 Prompt 预览 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">预览</h3>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={isPending}
            onClick={handleCopy}
            className="gap-1.5"
          >
            {feedback === "已复制" ? (
              <>
                <CheckIcon className="size-4" />
                已复制
              </>
            ) : (
              <>
                <CopyIcon className="size-4" />
                复制
              </>
            )}
          </Button>
        </div>
        <div className="relative">
          <pre className="overflow-x-auto rounded-2xl border border-border/60 bg-muted/30 p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground/80 min-h-[120px]">
            {finalPrompt}
          </pre>
        </div>
      </section>
    </div>
  );
}
