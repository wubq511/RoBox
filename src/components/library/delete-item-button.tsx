"use client";

import { useActionState, useRef } from "react";
import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  deleteItemAction,
} from "@/server/items/actions";
import type { ItemType } from "@/lib/schema/items";
import { initialItemFormState } from "@/server/items/form-state";

type DeleteItemButtonProps = {
  itemId: string;
  type: ItemType;
  label?: string;
};

export function DeleteItemButton({
  itemId,
  type,
  label = "Delete",
}: Readonly<DeleteItemButtonProps>) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    deleteItemAction,
    initialItemFormState,
  );

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="type" value={type} />
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined") {
            const confirmed = window.confirm(
              `Delete this ${type}? This cannot be undone.`,
            );

            if (!confirmed) {
              return;
            }
          }

          formRef.current?.requestSubmit();
        }}
      >
        <Trash2Icon className="size-4" />
        {label}
      </Button>
      {state.status === "error" ? (
        <span className="text-xs text-destructive" role="alert">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
