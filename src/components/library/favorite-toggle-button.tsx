"use client";

import { StarIcon } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SubmitButton({ isFavorite }: { isFavorite: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center rounded-lg p-1.5 transition-colors",
        isFavorite
          ? "text-amber-400 hover:text-amber-300"
          : "text-muted-foreground/40 hover:text-muted-foreground",
      )}
      aria-label={isFavorite ? "取消收藏" : "收藏"}
    >
      <StarIcon
        className="size-4"
        fill={isFavorite ? "currentColor" : "none"}
      />
    </button>
  );
}

type FavoriteToggleButtonProps = {
  itemId: string;
  type: "prompt" | "skill";
  isFavorite: boolean;
  toggleAction: (formData: FormData) => void;
  variant?: "icon" | "button";
};

export function FavoriteToggleButton({
  itemId,
  type,
  isFavorite,
  toggleAction,
  variant = "icon",
}: Readonly<FavoriteToggleButtonProps>) {
  return (
    <form
      action={toggleAction}
      onClick={(e) => e.stopPropagation()}
    >
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="type" value={type} />
      {variant === "button" ? (
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1.5",
            isFavorite ? "text-amber-400" : "text-muted-foreground",
          )}
        >
          <StarIcon
            className="size-4"
            fill={isFavorite ? "currentColor" : "none"}
          />
          {isFavorite ? "已收藏" : "收藏"}
        </Button>
      ) : (
        <SubmitButton isFavorite={isFavorite} />
      )}
    </form>
  );
}
