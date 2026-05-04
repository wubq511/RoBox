"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

function ToastItem({ toast, onDismiss }: { toast: { id: string; title: string; description?: string; variant?: "default" | "destructive" }; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enter = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(enter);
  }, []);

  const isDestructive = toast.variant === "destructive";

  return (
    <div
      className={`
        pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg
        transition-all duration-300
        ${visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}
        ${
          isDestructive
            ? "border-red-200 bg-red-50 text-red-900"
            : "border-border bg-background text-foreground"
        }
      `}
    >
      <div className="flex-1 space-y-1">
        {toast.title ? (
          <p className="text-sm font-medium">{toast.title}</p>
        ) : null}
        {toast.description ? (
          <p className={`text-sm ${isDestructive ? "text-red-700" : "text-muted-foreground"}`}>
            {toast.description}
          </p>
        ) : null}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-xs opacity-50 hover:opacity-100"
        aria-label="关闭"
      >
        ✕
      </button>
    </div>
  );
}

export function Toaster() {
  const { toasts } = useToast();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const visibleToasts = toasts.filter((t) => !dismissed.has(t.id));

  if (visibleToasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {visibleToasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  );
}
