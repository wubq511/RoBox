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
  return error instanceof Error ? error.message : "GitHub 导入失败";
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
                message: payload.error ?? "GitHub 导入失败",
              });
              return;
            }

            const itemId = payload.item?.id;

            if (!itemId) {
              setFeedback({
                type: "error",
                message: "GitHub 导入未返回 Skill ID",
              });
              return;
            }

            setFeedback({
              type: "success",
              message: payload.warning ?? "导入成功，正在打开 Skill",
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
        <h2 className="text-sm font-semibold">从 GitHub 导入</h2>
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
          {isPending ? "导入中" : "导入 Skill"}
        </Button>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        支持的来源：github.com 和 raw.githubusercontent.com。
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
