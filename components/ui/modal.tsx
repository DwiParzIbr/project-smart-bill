"use client";

import React, { useEffect } from "react";
import {
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
  X,
  HelpCircle,
} from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "primary";
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  variant = "danger",
  icon,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-rose-50 text-rose-600 border-rose-100",
          defaultIcon: <Trash2 className="w-6 h-6" />,
          buttonBg: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
        };
      case "warning":
        return {
          iconBg: "bg-amber-50 text-amber-600 border-amber-100",
          defaultIcon: <AlertTriangle className="w-6 h-6" />,
          buttonBg: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
        };
      case "primary":
      case "info":
      default:
        return {
          iconBg: "bg-sky-50 text-sky-600 border-sky-100",
          defaultIcon: <HelpCircle className="w-6 h-6" />,
          buttonBg: "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 space-y-4">
        <div className="flex items-start justify-between">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${styles.iconBg}`}
          >
            {icon || styles.defaultIcon}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 active:scale-98 transition min-touch-target"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md active:scale-98 transition min-touch-target ${styles.buttonBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  buttonText?: string;
  variant?: "info" | "warning" | "error" | "success";
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  description,
  buttonText = "Mengerti",
  variant = "warning",
}: AlertDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "error":
        return {
          iconBg: "bg-rose-50 text-rose-600 border-rose-100",
          icon: <AlertTriangle className="w-6 h-6" />,
          buttonBg: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
        };
      case "warning":
        return {
          iconBg: "bg-amber-50 text-amber-600 border-amber-100",
          icon: <AlertTriangle className="w-6 h-6" />,
          buttonBg: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
        };
      case "success":
        return {
          iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
          icon: <CheckCircle2 className="w-6 h-6" />,
          buttonBg: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
        };
      case "info":
      default:
        return {
          iconBg: "bg-sky-50 text-sky-600 border-sky-100",
          icon: <Info className="w-6 h-6" />,
          buttonBg: "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 space-y-4">
        <div className="flex items-start justify-between">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${styles.iconBg}`}
          >
            {styles.icon}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md active:scale-98 transition min-touch-target ${styles.buttonBg}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
