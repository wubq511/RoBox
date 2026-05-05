"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ItemType } from "@/lib/schema/items";

type CategoryItem = {
  id: string;
  name: string;
  sortOrder: number;
};

type CategoryManagerProps = {
  type: ItemType;
};

type DeleteConfirmState = {
  name: string;
  usageCount: number;
} | null;

async function loadCategories(type: ItemType): Promise<{
  categories: CategoryItem[];
  error: string | null;
}> {
  try {
    const res = await fetch(`/api/categories?type=${type}`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    const data = await res.json();
    return {
      categories: (data.categories ?? []).map(
        (c: { id: string; name: string; sortOrder: number }) => ({
          id: c.id,
          name: c.name,
          sortOrder: c.sortOrder,
        }),
      ),
      error: null,
    };
  } catch {
    return { categories: [], error: "加载分类失败" };
  }
}

export function CategoryManager({ type }: CategoryManagerProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>(null);
  const [replacementCategory, setReplacementCategory] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const result = await loadCategories(type);
    setCategories(result.categories);
    if (result.error) setError(result.error);
    setLoading(false);
  }, [type]);

  useEffect(() => {
    let cancelled = false;
    loadCategories(type).then((result) => {
      if (cancelled) return;
      setCategories(result.categories);
      if (result.error) setError(result.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [type]);

  const handleAdd = useCallback(async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setAdding(true);
    setError(null);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409) {
          setError("分类已存在");
        } else {
          setError(data.error ?? "添加失败");
        }
        return;
      }

      setNewName("");
      await refresh();
    } catch {
      setError("添加分类失败");
    } finally {
      setAdding(false);
    }
  }, [newName, type, refresh]);

  const handleDelete = useCallback(
    async (name: string) => {
      setDeleting(name);
      setError(null);

      try {
        const res = await fetch(
          `/api/categories/${encodeURIComponent(name)}?type=${type}`,
          { method: "DELETE" },
        );

        if (!res.ok) {
          const data = await res.json();

          if (res.status === 409 && data.requiresReplacement) {
            setDeleteConfirm({
              name,
              usageCount: data.usageCount,
            });
            const others = categories.filter((c) => c.name !== name);
            if (others.length > 0) {
              setReplacementCategory(others[0].name);
            }
            return;
          }

          setError(data.error ?? "删除失败");
          return;
        }

        await refresh();
      } catch {
        setError("删除分类失败");
      } finally {
        setDeleting(null);
      }
    },
    [type, refresh, categories],
  );

  const handleForceDelete = useCallback(async () => {
    if (!deleteConfirm || !replacementCategory) return;

    setDeleting(deleteConfirm.name);
    setError(null);

    try {
      const res = await fetch(
        `/api/categories/${encodeURIComponent(deleteConfirm.name)}?type=${type}`,
        {
          method: "DELETE",
          headers: { "x-replacement-category": replacementCategory },
        },
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "删除失败");
        return;
      }

      setDeleteConfirm(null);
      setReplacementCategory("");
      await refresh();
    } catch {
      setError("删除分类失败");
    } finally {
      setDeleting(null);
    }
  }, [deleteConfirm, replacementCategory, type, refresh]);

  const handleReorder = useCallback(
    async (index: number, direction: "up" | "down") => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= categories.length) return;

      const reordered = [...categories];
      const temp = reordered[index];
      reordered[index] = reordered[newIndex];
      reordered[newIndex] = temp;

      setCategories(reordered);

      try {
        await fetch("/api/categories/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            orderedNames: reordered.map((c) => c.name),
          }),
        });
      } catch {
        setError("排序失败");
        refresh();
      }
    },
    [categories, type, refresh],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="输入新分类名称"
          maxLength={32}
          className="h-9 flex-1"
          disabled={adding}
        />
        <Button
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
          size="sm"
          className="h-9 gap-1.5 px-3"
        >
          {adding ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <PlusIcon className="size-3.5" />
          )}
          添加
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-1">
        {categories.map((category, index) => (
          <div
            key={category.id}
            className="group flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted/50"
          >
            <span className="flex-1 text-sm">{category.name}</span>
            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleReorder(index, "up")}
                disabled={index === 0}
              >
                <ArrowUpIcon className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleReorder(index, "down")}
                disabled={index === categories.length - 1}
              >
                <ArrowDownIcon className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDelete(category.name)}
                disabled={deleting === category.name}
              >
                {deleting === category.name ? (
                  <Loader2Icon className="size-3 animate-spin" />
                ) : (
                  <Trash2Icon className="size-3" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {deleteConfirm && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm">
            分类「{deleteConfirm.name}」下有 {deleteConfirm.usageCount} 条内容，删除后这些内容的分类将迁移为：
          </p>
          <select
            value={replacementCategory}
            onChange={(e) => setReplacementCategory(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none"
          >
            {categories
              .filter((c) => c.name !== deleteConfirm.name)
              .map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
          </select>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleForceDelete}
              disabled={!replacementCategory}
              className="h-8"
            >
              确认删除并迁移
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDeleteConfirm(null);
                setReplacementCategory("");
              }}
              className="h-8"
            >
              取消
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
