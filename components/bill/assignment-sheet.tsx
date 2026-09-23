"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Users, Percent, Coins } from "lucide-react";
import { BillItem, ItemAssignment, Participant, ShareType } from "@/lib/types/bill";
import { formatCurrency, formatNumberInput, parseNumberInput } from "@/lib/utils";
import { AlertDialog } from "@/components/ui/modal";

interface AssignmentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: BillItem | null;
  participants: Participant[];
  onSave: (itemId: string, assignments: ItemAssignment[]) => void;
}

export function AssignmentSheet({
  isOpen,
  onClose,
  item,
  participants,
  onSave,
}: AssignmentSheetProps) {
  const [shareType, setShareType] = useState<ShareType>("equal");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [percentageValues, setPercentageValues] = useState<Record<string, number>>({});
  const [fixedValues, setFixedValues] = useState<Record<string, number>>({});
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (!item) return;

    if (item.assignments.length > 0) {
      setShareType(item.assignments[0].shareType);
      setSelectedParticipants(item.assignments.map((a) => a.participantId));

      const pVals: Record<string, number> = {};
      const fVals: Record<string, number> = {};
      item.assignments.forEach((a) => {
        if (a.shareType === "percentage") pVals[a.participantId] = a.shareValue;
        if (a.shareType === "fixed") fVals[a.participantId] = a.shareValue;
      });
      setPercentageValues(pVals);
      setFixedValues(fVals);
    } else {
      // Default: select everyone equally
      setShareType("equal");
      setSelectedParticipants(participants.map((p) => p.id));
      setPercentageValues({});
      setFixedValues({});
    }
  }, [item, participants]);

  if (!isOpen || !item) return null;

  const itemTotal = item.quantity * item.unitPrice;

  // Percentage calculations
  const totalPercent = selectedParticipants.reduce(
    (sum, id) => sum + (percentageValues[id] || 0),
    0
  );

  // Fixed calculations
  const totalFixed = selectedParticipants.reduce(
    (sum, id) => sum + (fixedValues[id] || 0),
    0
  );

  const toggleParticipant = (id: string) => {
    if (selectedParticipants.includes(id)) {
      setSelectedParticipants(selectedParticipants.filter((p) => p !== id));
    } else {
      setSelectedParticipants([...selectedParticipants, id]);
    }
  };

  const selectAll = () => {
    setSelectedParticipants(participants.map((p) => p.id));
  };

  const clearAll = () => {
    setSelectedParticipants([]);
  };

  const handleSave = () => {
    if (selectedParticipants.length === 0) {
      setShowAlert(true);
      return;
    }

    let assignments: ItemAssignment[] = [];

    if (shareType === "equal") {
      assignments = selectedParticipants.map((id) => ({
        id: `asg_${id}_${Date.now()}`,
        participantId: id,
        shareType: "equal",
        shareValue: 1,
      }));
    } else if (shareType === "percentage") {
      assignments = selectedParticipants.map((id) => ({
        id: `asg_${id}_${Date.now()}`,
        participantId: id,
        shareType: "percentage",
        shareValue: percentageValues[id] || 0,
      }));
    } else if (shareType === "fixed") {
      assignments = selectedParticipants.map((id) => ({
        id: `asg_${id}_${Date.now()}`,
        participantId: id,
        shareType: "fixed",
        shareValue: fixedValues[id] || 0,
      }));
    }

    onSave(item.id, assignments);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">{item.name}</h3>
            <p className="text-xs text-slate-500">
              {item.quantity} × {formatCurrency(item.unitPrice)} ={" "}
              <span className="font-semibold text-slate-800">
                {formatCurrency(itemTotal)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 min-touch-target flex items-center justify-center"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 p-1.5 mx-4 mt-3 bg-slate-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setShareType("equal")}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition min-touch-target ${
              shareType === "equal"
                ? "bg-white text-sky-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4" />
            Bagi Rata
          </button>
          <button
            type="button"
            onClick={() => setShareType("percentage")}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition min-touch-target ${
              shareType === "percentage"
                ? "bg-white text-sky-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Percent className="w-4 h-4" />
            Persentase
          </button>
          <button
            type="button"
            onClick={() => setShareType("fixed")}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition min-touch-target ${
              shareType === "fixed"
                ? "bg-white text-sky-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Coins className="w-4 h-4" />
            Nominal Pas
          </button>
        </div>

        {/* Quick select buttons */}
        <div className="flex items-center justify-between px-4 pt-3 text-xs">
          <span className="font-medium text-slate-600">Siapa yang memesan?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-sky-600 font-semibold hover:underline"
            >
              Pilih Semua
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={clearAll}
              className="text-slate-500 hover:underline"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Participant list with mode inputs */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {participants.map((participant) => {
            const isSelected = selectedParticipants.includes(participant.id);

            return (
              <div
                key={participant.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isSelected
                    ? "border-sky-500 bg-sky-50/40"
                    : "border-slate-200 bg-white opacity-80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleParticipant(participant.id)}
                    className="flex items-center gap-3 text-left flex-1 min-touch-target"
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                        isSelected
                          ? "bg-sky-600 text-white"
                          : "border-2 border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {participant.name}
                      </p>
                      {shareType === "equal" && isSelected && (
                        <p className="text-xs text-sky-600 font-medium">
                          ≈ {formatCurrency(Math.floor(itemTotal / selectedParticipants.length))}
                        </p>
                      )}
                    </div>
                  </button>

                  {/* Mode 2: Percentage input */}
                  {shareType === "percentage" && isSelected && (
                    <div className="flex items-center gap-1 w-24">
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={percentageValues[participant.id] ?? ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setPercentageValues({
                            ...percentageValues,
                            [participant.id]: val,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-right font-bold text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  )}

                  {/* Mode 3: Fixed input */}
                  {shareType === "fixed" && isSelected && (
                    <div className="flex items-center gap-1 w-32">
                      <span className="text-xs text-slate-400 font-medium">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={
                          fixedValues[participant.id] > 0
                            ? formatNumberInput(fixedValues[participant.id])
                            : ""
                        }
                        onChange={(e) => {
                          const val = parseNumberInput(e.target.value);
                          setFixedValues({
                            ...fixedValues,
                            [participant.id]: val,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-right font-bold text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Validation info for percentage / fixed */}
        {shareType === "percentage" && (
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">Total Persentase:</span>
            <span
              className={`font-bold ${
                totalPercent === 100 ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {totalPercent}% {totalPercent === 100 ? "✓ Pas" : `(Sisa ${100 - totalPercent}%)`}
            </span>
          </div>
        )}

        {shareType === "fixed" && (
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">Total Nominal:</span>
            <span
              className={`font-bold ${
                totalFixed === itemTotal ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {formatCurrency(totalFixed)}{" "}
              {totalFixed === itemTotal
                ? "✓ Pas"
                : `(Selisih ${formatCurrency(itemTotal - totalFixed)})`}
            </span>
          </div>
        )}

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 flex items-center gap-2.5 pb-safe">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 min-touch-target"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md transition active:scale-98 min-touch-target flex items-center justify-center gap-2"
          >
            Simpan Pembagian
          </button>
        </div>
      </div>

      <AlertDialog
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title="Pilih Peserta"
        description="Pilih minimal 1 orang peserta yang memesan atau patungan untuk menu ini."
        variant="warning"
      />
    </div>
  );
}
