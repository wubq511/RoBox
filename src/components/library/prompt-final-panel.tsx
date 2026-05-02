"use client";

import { useMemo, useState, useTransition } from "react";
import { CopyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Variables</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Fill values here to generate a copy-ready prompt.
          </p>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {variables.length}
        </span>
      </div>

      {variables.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          No variables yet. Smart analyze can extract variables, and raw copy still
          works.
        </div>
      ) : (
        <div className="space-y-3">
          {variables.map((variable) => (
            <label
              key={variable.name}
              className="block rounded-2xl border border-border/70 bg-muted/30 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm font-medium">
                  {variable.name}
                </span>
                {variable.required ? (
                  <Badge variant="outline" className="rounded-full px-2.5">
                    Required
                  </Badge>
                ) : null}
              </div>
              <Input
                value={values[variable.name] ?? ""}
                placeholder={variable.description}
                className="mt-3 font-mono"
                onChange={(event) => {
                  setValues((currentValues) => ({
                    ...currentValues,
                    [variable.name]: event.target.value,
                  }));
                }}
              />
              {variable.description ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {variable.description}
                </p>
              ) : null}
              {variable.defaultValue ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Default: {variable.defaultValue}
                </p>
              ) : null}
            </label>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Final prompt preview</h3>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isPending}
              onClick={() => {
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

                    setFeedback("Copied final prompt.");
                  } catch (error) {
                    setFeedback(
                      error instanceof Error ? error.message : "Copy failed.",
                    );
                  }
                });
              }}
            >
              <CopyIcon className="size-4" />
              Copy final
            </Button>
            {feedback ? (
              <span className="text-xs text-muted-foreground" role="status">
                {feedback}
              </span>
            ) : null}
          </div>
        </div>
        <pre className="overflow-x-auto rounded-[22px] border border-border/70 bg-muted/30 p-4 font-mono text-xs leading-6 whitespace-pre-wrap text-muted-foreground">
          {finalPrompt}
        </pre>
      </div>
    </section>
  );
}
