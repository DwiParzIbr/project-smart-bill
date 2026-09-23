"use client";

import React, { useState } from "react";
import { BillItem, ItemAssignment, Participant } from "@/lib/types/bill";
import { formatCurrency } from "@/lib/utils";
import { Users, AlertCircle, ChevronRight, CheckCheck, Sparkles } from "lucide-react";
import { AssignmentSheet } from "../assignment-sheet";

interface StepAssignmentsProps {
  items: BillItem[];
  participants: Participant[];
  currency: string;
  onChange: (items: BillItem[]) => void;
}

export function StepAssignments({
  items,
  participants,
  currency,
  onChange,
}: StepAssignmentsProps) {
  const [activeItem, setActiveItem] = useState<BillItem | null>(null);

  const handleSaveAssignment = (itemId: string, assignments: ItemAssignment[]) => {
    onChange(
      items.map((it) => (it.id === itemId ? { ...it, assignments } : it))
    );
  };

  const splitAllEqually = () => {
    const updated = items.map((item) => ({
      ...item,
      assignments: participants.map((p) => ({
        id: `asg_${p.id}_${Date.now()}`,
        participantId: p.id,
        shareType: "equal" as const,
        shareValue: 1,
      })),
    }));
    onChange(updated);
  };

  const unassignedCount = items.filter(
    (it) => !it.assignments || it.assignments.length === 0
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Penentuan Pemesan
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tentukan siapa saja yang memesan setiap menu berikut.
          </p>
        </div>

        <button
          type="button"
          onClick={splitAllEqually}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-semibold hover:bg-sky-100 transition shrink-0 min-touch-target"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bagi Rata Semua</span>
        </button>
      </div>

      {unassignedCount > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Ada <strong>{unassignedCount} menu</strong> yang belum ditentukan pemesannya. Tap menu di bawah untuk mengatur.
          </span>
        </div>
      )}

      <div className="space-y-2.5">
        {items.map((item) => {
          const hasAssignments = item.assignments && item.assignments.length > 0;
          const assignedNames = (item.assignments || [])
            .map(
              (a) =>
                participants.find((p) => p.id === a.participantId)?.name || "?"
            )
            .filter(Boolean);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveItem(item)}
              className="w-full text-left p-4 bg-white border border-slate-200 rounded-2xl shadow-xs transition hover:border-sky-300 hover:shadow-sm flex items-center justify-between gap-3 min-touch-target group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-900 text-sm truncate">
                    {item.name}
                  </h3>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatCurrency(item.totalPrice, currency)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {hasAssignments ? (
                    <>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold">
                        <CheckCheck className="w-3 h-3" />
                        <span>{assignedNames.length} Orang:</span>
                      </div>
                      <span className="text-xs text-slate-600 truncate max-w-[200px] sm:max-w-xs">
                        {assignedNames.join(", ")}
                      </span>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-semibold">
                      <Users className="w-3 h-3" />
                      Belum Dibagikan (Tap Di Sini)
                    </span>
                  )}
                </div>
              </div>

              <div className="p-1 rounded-full text-slate-400 group-hover:text-sky-600 transition">
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom sheet dialog */}
      <AssignmentSheet
        isOpen={Boolean(activeItem)}
        onClose={() => setActiveItem(null)}
        item={activeItem}
        participants={participants}
        onSave={handleSaveAssignment}
      />
    </div>
  );
}
