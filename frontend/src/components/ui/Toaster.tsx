"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const icons = {
    success: <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />,
    error: <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />,
    info: <Info size={16} className="text-blue-400 flex-shrink-0" />,
    warning: <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />,
  };

  const styles = {
    success: "border-emerald-500/30 bg-emerald-950/80",
    error: "border-rose-500/30 bg-rose-950/80",
    info: "border-blue-500/30 bg-blue-950/80",
    warning: "border-amber-500/30 bg-amber-950/80",
  };

  // Expose add via context via window for global access
  if (typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>).__toastAdd = add;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 px-4 py-3 rounded-xl border glass-strong",
            "shadow-xl animate-fade-in",
            styles[t.type]
          )}
        >
          {icons[t.type]}
          <span className="text-sm text-slate-200 flex-1">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// Global toast helper — call from anywhere
export function toast(message: string, type: ToastType = "info") {
  if (typeof window !== "undefined") {
    const fn = (window as unknown as Record<string, unknown>).__toastAdd as ((m: string, t: ToastType) => void) | undefined;
    fn?.(message, type);
  }
}

export const toastSuccess = (m: string) => toast(m, "success");
export const toastError = (m: string) => toast(m, "error");
export const toastInfo = (m: string) => toast(m, "info");
export const toastWarning = (m: string) => toast(m, "warning");
