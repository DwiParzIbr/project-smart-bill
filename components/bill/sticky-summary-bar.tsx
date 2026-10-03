"use client";

import React from "react";
import { ArrowRight, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StickySummaryBarProps {
  itemCount: number;
  participantCount: number;
  estimatedTotal: number;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack?: () => void;
  isNextDisabled?: boolean;
}

export function StickySummaryBar({
  itemCount,
  participantCount,
  estimatedTotal,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  isNextDisabled = false,
}: StickySummaryBarProps) {
  const isFinalStep = currentStep === totalSteps;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="max-w-md sm:max-w-2xl mx-auto flex items-center justify-between gap-3">
        {/* Summary Info */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>{participantCount} Orang</span>
            <span>•</span>
            <span>{itemCount} Menu</span>
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 truncate">
            {formatCurrency(estimatedTotal)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          {onBack && currentStep > 1 && (
            <button
              type="button"
              onClick={onBack}
              className="h-11 px-4 rounded-xl border border-slate-300 bg-slate-50/80 text-slate-700 font-bold text-sm hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition flex items-center justify-center shadow-xs min-touch-target"
            >
              Kembali
            </button>
          )}

          <button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled}
            className={`h-11 px-5 rounded-xl font-bold text-sm text-white shadow-md transition flex items-center justify-center gap-2 active:scale-95 min-touch-target ${
              isNextDisabled
                ? "bg-slate-300 cursor-not-allowed text-slate-500 shadow-none"
                : isFinalStep
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25"
                : "bg-sky-600 hover:bg-sky-700 shadow-sky-600/25"
            }`}
          >
            {isFinalStep ? (
              <>
                <Calculator className="w-4 h-4" />
                <span>Lihat Hasil Split</span>
              </>
            ) : (
              <>
                <span>Lanjut</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
