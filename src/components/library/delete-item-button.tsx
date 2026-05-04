"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deleteItemAction } from "@/server/items/actions";

export function DeleteItemButton({
  itemId,
  itemType,
}: Readonly<{
  itemId: string;
  itemType: "prompt" | "skill";
}>) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleDelete() {
    if (isDeleting) return;
    const ok = window.confirm("确定要删除这条内容吗？此操作不可撤销。");
    if (!ok) return;

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.set("itemId", itemId);
      formData.set("type", itemType);

      const result = await deleteItemAction(void 0, formData);

      if (result && result.status === "error") {
        throw new Error(result.message);
      }

      toast({
        title: "已删除",
        description: "内容已成功删除。",
      });

      const collectionPath = itemType === "prompt" ? "/prompts" : "/skills";
      router.push(collectionPath);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "删除失败，请稍后重试";
      toast({
        title: "删除失败",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button
      variant="destructive"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          删除中
        </>
      ) : (
        <>
          <Trash2Icon className="size-4" />
          删除
        </>
      )}
    </Button>
  );
}
