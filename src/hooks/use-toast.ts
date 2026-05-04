"use client";

import { useState, useCallback, useEffect } from "react";

export type ToastVariant = "default" | "destructive";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function emit() {
  toastListeners.forEach((listener) => listener([...toasts]));
}

function addToast(toast: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2, 9);
  toasts = [...toasts, { ...toast, id }];
  emit();
  setTimeout(() => {
    removeToast(id);
  }, 4000);
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function useToast() {
  const [localToasts, setLocalToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setLocalToasts(newToasts);
    };
    toastListeners.push(listener);
    listener([...toasts]);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const toast = useCallback(
    (props: { title: string; description?: string; variant?: ToastVariant }) => {
      addToast(props);
    },
    []
  );

  return { toast, toasts: localToasts };
}

export function getToasts() {
  return [...toasts];
}
