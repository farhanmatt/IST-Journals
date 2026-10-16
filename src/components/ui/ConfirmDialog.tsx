"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { AlertTriangle, AlertCircle, CheckCircle2, Info, LogOut, Trash2, X } from "lucide-react";

export type ConfirmVariant = "danger" | "warning" | "primary" | "info";

export interface ConfirmOptions {
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: React.ElementType;
}

export interface ConfirmDialogProps extends ConfirmOptions {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  icon: CustomIcon,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel, isLoading]);

  // Focus primary button when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Icon and badge styling based on variant
  const getBadgeConfig = () => {
    if (CustomIcon) {
      return {
        Icon: CustomIcon,
        badgeStyle: variant === "danger" 
          ? "bg-red-50 text-red-600 ring-8 ring-red-50/60" 
          : variant === "warning" 
          ? "bg-amber-50 text-amber-600 ring-8 ring-amber-50/60" 
          : "bg-blue-50 text-blue-600 ring-8 ring-blue-50/60",
      };
    }

    switch (variant) {
      case "danger":
        return {
          Icon: Trash2,
          badgeStyle: "bg-red-50 text-red-600 ring-8 ring-red-50/60",
        };
      case "warning":
        return {
          Icon: AlertCircle,
          badgeStyle: "bg-amber-50 text-amber-600 ring-8 ring-amber-50/60",
        };
      case "info":
        return {
          Icon: Info,
          badgeStyle: "bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/60",
        };
      case "primary":
      default:
        return {
          Icon: CheckCircle2,
          badgeStyle: "bg-blue-50 text-blue-600 ring-8 ring-blue-50/60",
        };
    }
  };

  const { Icon, badgeStyle } = getBadgeConfig();

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm shadow-red-500/20 focus:ring-red-500/30";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-sm shadow-amber-500/20 focus:ring-amber-500/30";
      case "info":
        return "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm shadow-indigo-500/20 focus:ring-indigo-500/30";
      case "primary":
      default:
        return "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm shadow-blue-500/20 focus:ring-blue-500/30";
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      {/* Backdrop click dismiss */}
      <div 
        className="fixed inset-0 -z-10" 
        onClick={() => {
          if (!isLoading) onCancel();
        }}
        aria-hidden="true" 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Dismiss 'X' Button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Icon Badge */}
        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${badgeStyle}`}>
            <Icon className="w-6 h-6" />
          </div>

          <div className="pt-0.5 pr-6 space-y-1">
            <h3 id="confirm-dialog-title" className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {title}
            </h3>
            <div id="confirm-dialog-desc" className="text-sm text-slate-600 leading-relaxed">
              {typeof message === "string" ? <p>{message}</p> : message}
            </div>
          </div>
        </div>

        {/* Actions Button Group */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-center"
          >
            {cancelText}
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed text-center ${getConfirmButtonClasses()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Context for global imperative useConfirm() hook
type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmOptions & { isOpen: boolean } | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({ ...options, isOpen: true });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState(null);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setState(null);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state?.isOpen && (
        <ConfirmDialog
          isOpen={state.isOpen}
          title={state.title}
          message={state.message}
          confirmText={state.confirmText}
          cancelText={state.cancelText}
          variant={state.variant}
          icon={state.icon}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}
