"use client";

import React, { useState } from "react";
import {
  BillData,
  BillPayer,
  DebtSettlement,
  ParticipantCalculation,
} from "@/lib/types/bill";
import { calculateDebtSettlements } from "@/lib/calculation/engine";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  Copy,
  CreditCard,
  Edit3,
  Repeat,
  Sparkles,
  Users,
  X,
} from "lucide-react";

interface DebtSimplificationCardProps {
  bill: BillData;
  participants: ParticipantCalculation[];
  onUpdatePayers: (payers: BillPayer[]) => void;
}

export function DebtSimplificationCard({
  bill,
  participants,
  onUpdatePayers,
}: DebtSimplificationCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Local state for modal editing
  const [tempPayers, setTempPayers] = useState<Record<string, number>>({});

  const totalBill = participants.reduce((sum, p) => sum + p.finalTotal, 0);

  // Settlements
  const settlements: DebtSettlement[] = calculateDebtSettlements(
    bill.participants,
    bill.payers,
    participants
  );

  // Format who paid upfront
  const payerMap = new Map<string, number>();
  if (bill.payers && bill.payers.length > 0) {
    bill.payers.forEach((p) => payerMap.set(p.participantId, p.amount));
  } else if (bill.participants.length > 0) {
    payerMap.set(bill.participants[0].id, totalBill);
  }

  const openModal = () => {
    const initial: Record<string, number> = {};
    bill.participants.forEach((p) => {
      initial[p.id] = payerMap.get(p.id) || 0;
    });
    setTempPayers(initial);
    setShowEditModal(true);
  };

  const handlePayerChange = (id: string, amount: number) => {
    setTempPayers((prev) => ({
      ...prev,
      [id]: Math.max(0, amount),
    }));
  };

  const handleSavePayers = () => {
    const list: BillPayer[] = Object.entries(tempPayers)
      .filter(([_, amount]) => amount > 0)
      .map(([participantId, amount]) => ({ participantId, amount }));

    onUpdatePayers(list);
    setShowEditModal(false);
  };

  const tempSum = Object.values(tempPayers).reduce((sum, v) => sum + (v || 0), 0);
  const isDiff = tempSum !== totalBill;

  const handleCopySchema = async () => {
    const lines: string[] = [];
    lines.push(`🔄 *SKEMA TRANSFER PATUNGAN (${bill.title.toUpperCase()})*`);
    lines.push(`Total Tagihan: ${formatCurrency(totalBill, bill.currency)}`);
    lines.push(`---------------------------------`);
    lines.push(`💳 *Dibayar di Depan Oleh:*`);
    bill.participants.forEach((p) => {
      const amt = payerMap.get(p.id) || 0;
      if (amt > 0) {
        lines.push(`• ${p.name}: ${formatCurrency(amt, bill.currency)}`);
      }
    });

    lines.push(`\n🤝 *Penyederhanaan Transfer (Minim Transaksi):*`);
    if (settlements.length === 0) {
      lines.push(`✓ Semua impas, tidak ada transfer yang diperlukan!`);
    } else {
      settlements.forEach((s) => {
        lines.push(`• *${s.fromName}* ➔ Transfer *${formatCurrency(s.amount, bill.currency)}* ke *${s.toName}*`);
      });
    }

    lines.push(`\n_Dihitung otomatis via Smart Bill Splitter_ ⚡`);

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const isMultiPayer = (bill.payers && bill.payers.length > 1);

  return (
    <div className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Repeat className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Siapa Transfer ke Siapa (Penyederhanaan Utang)
            </h3>
            <p className="text-[11px] text-slate-500">
              {isMultiPayer
                ? `${bill.payers?.length} Orang Menalangi di Depan`
                : `1 Orang Menalangi (${bill.participants[0]?.name || "Penagih"})`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition min-touch-target"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Atur Bayar</span>
        </button>
      </div>

      {/* Upfront payers summary chips */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {bill.participants.map((p) => {
          const paid = payerMap.get(p.id) || 0;
          if (paid <= 0) return null;
          return (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-xl border border-slate-200"
            >
              <CreditCard className="w-3 h-3 text-indigo-500" />
              <span>
                {p.name}: <strong>{formatCurrency(paid, bill.currency)}</strong>
              </span>
            </span>
          );
        })}
      </div>

      {/* Settlements List */}
      <div className="space-y-2 pt-1">
        {settlements.length === 0 ? (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-2xl text-center flex items-center justify-center gap-1.5 border border-emerald-200">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Semua impas! Setiap orang telah membayar bagiannya pas.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {settlements.map((s, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold truncate">
                    {s.fromName}
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 shrink-0">
                    <span className="text-[10px] font-medium hidden sm:inline">transfer</span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                  </div>

                  <div className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold truncate">
                    {s.toName}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-black text-slate-900">
                    {formatCurrency(s.amount, bill.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Copy Action */}
      {settlements.length > 0 && (
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={handleCopySchema}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 min-touch-target"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Skema Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Skema Transfer</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Edit Payers Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Atur Siapa yang Menalangi Tagihan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bisa lebih dari 1 orang yang bayar di depan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition min-touch-target"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Total tagihan yang harus dibayar:{" "}
              <strong className="text-slate-900">
                {formatCurrency(totalBill, bill.currency)}
              </strong>
            </p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {bill.participants.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="font-bold text-xs text-slate-800 truncate">
                    {p.name}
                  </div>
                  <div className="w-36">
                    <input
                      type="number"
                      value={tempPayers[p.id] ?? 0}
                      onChange={(e) =>
                        handlePayerChange(p.id, parseInt(e.target.value, 10) || 0)
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-right focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total check */}
            <div
              className={`p-2.5 rounded-xl text-xs font-bold flex justify-between ${
                isDiff
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}
            >
              <span>Total Ditalangi:</span>
              <span>
                {formatCurrency(tempSum, bill.currency)}
                {isDiff ? ` (Selisih ${formatCurrency(totalBill - tempSum, bill.currency)})` : " (Pas ✓)"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition min-touch-target"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSavePayers}
                className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition min-touch-target"
              >
                Simpan & Hitung
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
