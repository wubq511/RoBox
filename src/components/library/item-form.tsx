"use client";

import { useActionState } from "react";

import { PromptVariablesEditor } from "@/components/library/prompt-variables-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { itemCategories, type ItemEditorInput } from "@/lib/schema/items";
import {
  initialItemFormState,
  type ItemFormState,
} from "@/server/items/actions";

type ItemFormAction = (
  state: ItemFormState | void,
  formData: FormData,
) => Promise<ItemFormState | void>;

type ItemFormProps = {
  action: ItemFormAction;
  submitLabel: string;
  initialValue: ItemEditorInput;
};

export function ItemForm({
  action,
  submitLabel,
  initialValue,
}: Readonly<ItemFormProps>) {
  const [state, formAction] = useActionState(action, initialItemFormState);
  const resolvedState = state ?? initialItemFormState;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="type" value={initialValue.type} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Title</span>
          <Input name="title" defaultValue={initialValue.title} maxLength={120} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Category</span>
          <select
            name="category"
            defaultValue={initialValue.category}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none"
          >
            {itemCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium">Summary</span>
        <Textarea
          name="summary"
          defaultValue={initialValue.summary}
          maxLength={240}
          rows={3}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium">Tags</span>
        <Input
          name="tags"
          defaultValue={(initialValue.tags ?? []).join(", ")}
          placeholder="comma, separated, tags"
        />
      </label>

      {initialValue.type === "skill" ? (
        <label className="space-y-2">
          <span className="text-sm font-medium">Source URL</span>
          <Input name="sourceUrl" defaultValue={initialValue.sourceUrl} />
        </label>
      ) : (
        <input type="hidden" name="sourceUrl" value={initialValue.sourceUrl} />
      )}

      <label className="space-y-2">
        <span className="text-sm font-medium">Content</span>
        <Textarea
          name="content"
          defaultValue={initialValue.content}
          rows={14}
          required
        />
      </label>

      {initialValue.type === "prompt" ? (
        <PromptVariablesEditor initialVariables={initialValue.variables} />
      ) : (
        <input type="hidden" name="variables" value="[]" />
      )}

      <div className="flex items-center gap-3">
        <Button type="submit">{submitLabel}</Button>
        {resolvedState.status === "error" ? (
          <p className="text-sm text-destructive" role="alert">
            {resolvedState.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
