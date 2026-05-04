"use client";

import { useState } from "react";
import { HeartIcon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { toggleFavoriteAction } from "@/server/items/actions";
import type { ItemType } from "@/lib/schema/items";

export function FavoriteToggleButton({
  itemId,
  itemType,
  isFavorite,
}: Readonly<{
  itemId: string;
  itemType: ItemType;
  isFavorite: boolean;
}>) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function toggle() {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("itemId", itemId);
      formData.set("type", itemType);

      const result = await toggleFavoriteAction(formData);

      if (result && result.status === "error") {
        throw new Error(result.message);
      }

      setFavorite((prev) => !prev);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "操作失败，请稍后重试";
      toast({
        title: "操作失败",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle} disabled={isLoading}>
      {isLoading ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <HeartIcon
          className={`size-4 transition-colors ${
            favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
          }`}
        />
      )}
    </Button>
  );
}
