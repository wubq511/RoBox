"use client";

import { useState } from "react";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function DeleteItemButton({
  itemId,
}: Readonly<{
  itemId: string;
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
      const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
      if (res.ok) {
        toast({
          title: "已删除",
          description: "内容已成功删除。",
        });
        router.push("/library");
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "删除失败，请稍后重试");
      }
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
