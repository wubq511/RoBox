"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";

import { PromptVariablesEditor } from "@/components/library/prompt-variables-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type ItemCategory,
  type ItemType,
} from "@/lib/schema/items";
import type { PromptVariable } from "@/features/items/types";
import {
  initialItemFormState,
  type ItemFormState,
} from "@/server/items/form-state";

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-sm font-semibold text-foreground">
      {children}
      <span className="ml-0.5 text-destructive">*</span>
    </span>
  );
}

function OptionalLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-sm font-semibold text-foreground">
      {children}
    </span>
  );
}

type ItemFormAction = (
  state: ItemFormState | void,
  formData: FormData,
) => Promise<ItemFormState | void>;

type ItemFormProps = {
  type: ItemType;
  action: ItemFormAction;
  submitLabel: string;
  categories: string[];
  initialValues: {
    title: string;
    summary: string;
    category: ItemCategory;
    tags: string[];
    content: string;
    sourceUrl: string;
    variables: PromptVariable[];
  };
};

export function ItemForm({
  type,
  action,
  submitLabel,
  categories,
  initialValues,
}: Readonly<ItemFormProps>) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialItemFormState,
  );
  const resolvedState = state ?? initialItemFormState;

  return (
    <form action={formAction} className="space-y-10">
      <input type="hidden" name="type" value={type} />

      <div className="space-y-8">
        <label className="block">
          <OptionalLabel>标题</OptionalLabel>
          <div className="mt-4">
            <Input
              name="title"
              defaultValue={initialValues.title}
              maxLength={120}
              placeholder="给这个内容起个清晰的名称"
              className="h-11 text-base"
            />
          </div>
        </label>

        <div className="grid gap-8 sm:grid-cols-2">
          <label className="block">
            <OptionalLabel>分类</OptionalLabel>
            <div className="mt-4">
              <div className="relative">
                <select
                  name="category"
                  defaultValue={initialValues.category}
                  className="flex h-11 w-full appearance-none rounded-lg border border-input bg-transparent px-3 pr-8 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </label>

          <label className="block">
            <OptionalLabel>标签</OptionalLabel>
            <div className="mt-4">
              <Input
                name="tags"
                defaultValue={(initialValues.tags ?? []).join(", ")}
                placeholder="用逗号分隔：写作，翻译，AI"
                className="h-11"
              />
            </div>
          </label>
        </div>

        <label className="block">
          <OptionalLabel>摘要</OptionalLabel>
          <div className="mt-4">
            <Textarea
              name="summary"
              defaultValue={initialValues.summary}
              maxLength={240}
              rows={2}
              placeholder="简短描述这个内容的用途"
            />
          </div>
        </label>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-8">
        <label className="block">
          <RequiredLabel>内容</RequiredLabel>
          <div className="mt-4">
            <Textarea
              name="content"
              defaultValue={initialValues.content}
              required
              placeholder={
                type === "prompt"
                  ? "在这里输入 Prompt 内容，可以使用 {{变量名}} 定义动态变量"
                  : type === "tool"
                    ? "在这里输入工具链接、用途说明或安装方式"
                    : "在这里输入 Skill 内容"
              }
              className="min-h-[160px] resize-y leading-relaxed"
            />
          </div>
        </label>
      </div>

      {type === "skill" || type === "tool" ? (
        <>
          <div className="h-px bg-border" />
          <div className="space-y-8">
            <label className="block">
              <OptionalLabel>来源链接</OptionalLabel>
              <div className="mt-4">
                <Input
                  name="sourceUrl"
                  defaultValue={initialValues.sourceUrl}
                  placeholder={type === "tool" ? "https://example.com/..." : "https://github.com/..."}
                  className="h-11"
                />
              </div>
            </label>
          </div>
        </>
      ) : (
        <input type="hidden" name="sourceUrl" value={initialValues.sourceUrl} />
      )}

      {type === "prompt" ? (
        <>
          <div className="h-px bg-border" />
          <PromptVariablesEditor initialVariables={initialValues.variables} />
        </>
      ) : (
        <input type="hidden" name="variables" value="[]" />
      )}

      <div className="h-px bg-border" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button type="submit" disabled={isPending} size="lg" className="min-w-[140px]">
          {isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              保存中
            </>
          ) : (
            submitLabel
          )}
        </Button>
        {resolvedState.status === "error" ? (
          <p className="text-sm text-destructive" role="alert">
            {resolvedState.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
