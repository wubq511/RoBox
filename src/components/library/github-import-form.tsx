"use client";

import { useState, useTransition } from "react";
import { GitBranchIcon, ImportIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ImportFeedback = {
  type: "error" | "success";
  message: string;
};

type ImportResponse = {
  item?: {
    id?: string;
  };
  error?: string;
  warning?: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "GitHub import failed.";
}

export function GithubImportForm() {
  const [feedback, setFeedback] = useState<ImportFeedback | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const url = String(formData.get("githubUrl") ?? "");

        setFeedback(null);
        startTransition(async () => {
          try {
            const response = await fetch("/api/import/github", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ url }),
            });
            const payload = (await response.json()) as ImportResponse;

            if (!response.ok) {
              setFeedback({
                type: "error",
                message: payload.error ?? "GitHub import failed.",
              });
              return;
            }

            const itemId = payload.item?.id;

            if (!itemId) {
              setFeedback({
                type: "error",
                message: "GitHub import did not return a Skill id.",
              });
              return;
            }

            setFeedback({
              type: "success",
              message: payload.warning ?? "Imported. Opening Skill.",
            });
            window.location.assign(`/skills/${itemId}`);
          } catch (error) {
            setFeedback({
              type: "error",
              message: getErrorMessage(error),
            });
          }
        });
      }}
    >
      <div className="flex items-center gap-2">
        <GitBranchIcon className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Import from GitHub</h2>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="url"
          name="githubUrl"
          placeholder="https://github.com/tw93/Waza"
          required
        />
        <Button type="submit" disabled={isPending}>
          <ImportIcon className="size-4" />
          {isPending ? "Importing" : "Import Skill"}
        </Button>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Allowed sources: github.com and raw.githubusercontent.com.
      </p>
      {feedback ? (
        <p
          role={feedback.type === "error" ? "alert" : "status"}
          className={
            feedback.type === "error"
              ? "text-sm text-destructive"
              : "text-sm text-muted-foreground"
          }
        >
          {feedback.message}
        </p>
      ) : null}
    </form>
  );
}
