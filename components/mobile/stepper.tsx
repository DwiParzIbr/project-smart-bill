"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  currentStep: number;
  steps: { id: number; title: string; shortTitle: string }[];
  onSelectStep?: (step: number) => void;
}

export function Stepper({ currentStep, steps, onSelectStep }: StepperProps) {
  return (
    <div className="w-full bg-white border-b border-slate-200 px-4 py-3 sticky top-16 z-20">
      {/* Mobile compact bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
          <span>
            Langkah {currentStep} dari {steps.length}
          </span>
          <span className="text-sky-600 font-bold">
            {steps[currentStep - 1]?.title}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelectStep && onSelectStep(step.id)}
                className="group py-1 focus:outline-none"
                aria-label={`Ke langkah ${step.id}: ${step.title}`}
              >
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    isCompleted
                      ? "bg-sky-600"
                      : isCurrent
                      ? "bg-sky-500 ring-2 ring-sky-200"
                      : "bg-slate-200"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop / Tablet progress list */}
      <div className="hidden sm:flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => onSelectStep && onSelectStep(step.id)}
                className="flex items-center gap-2 group cursor-pointer focus:outline-none"
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    isCompleted
                      ? "bg-sky-600 text-white"
                      : isCurrent
                      ? "bg-sky-600 text-white ring-4 ring-sky-100"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isCurrent
                      ? "text-sky-700 font-bold"
                      : isCompleted
                      ? "text-slate-700"
                      : "text-slate-400"
                  )}
                >
                  {step.shortTitle}
                </span>
              </button>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors",
                    step.id < currentStep ? "bg-sky-500" : "bg-slate-200"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
