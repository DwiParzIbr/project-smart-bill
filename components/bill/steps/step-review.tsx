"use client";

import React, { useMemo } from "react";
import { BillData } from "@/lib/types/bill";
import { calculateBill } from "@/lib/calculation/engine";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, ShieldCheck, ChevronDown } from "lucide-react";

interface StepReviewProps {
  bill: BillData;
}

export function StepReview({ bill }: StepReviewProps) {
  const result = useMemo(() => {
    return calculateBill(bill.participants, bill.items, bill.charges);
  }, [bill]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Review & Verifikasi Tagihan
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Periksa kembali rincian dan nominal akhir sebelum membagikan hasil ke peserta.
        </p>
      </div>

      {/* Grand Total Summary Card */}
      <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl shadow-lg space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Total Pembayaran
            </span>
            <h3 className="text-2xl sm:text-3xl font-black mt-0.5">
              {formatCurrency(result.finalGrandTotal, bill.currency)}
            </h3>
          </div>
          {result.isBalanced ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Total Pas</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Selisih: {result.discrepancy}</span>
            </div>
          )}
        </div>

        {/* Breakdown lines */}
        <div className="pt-3 border-t border-slate-700/80 space-y-1.5 text-xs text-slate-300">
          <div className="flex justify-between">
            <span>Subtotal ({bill.items.length} menu)</span>
            <span className="font-semibold text-white">
              {formatCurrency(result.subtotal, bill.currency)}
            </span>
          </div>

          {result.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Diskon</span>
              <span className="font-semibold">
                -{formatCurrency(result.discountAmount, bill.currency)}
              </span>
            </div>
          )}

          {result.serviceChargeAmount > 0 && (
            <div className="flex justify-between">
              <span>Service Charge ({bill.charges.serviceRate}%)</span>
              <span className="font-semibold text-white">
                +{formatCurrency(result.serviceChargeAmount, bill.currency)}
              </span>
            </div>
          )}

          {result.taxAmount > 0 && (
            <div className="flex justify-between">
              <span>Pajak Restoran ({bill.charges.taxRate}%)</span>
              <span className="font-semibold text-white">
                +{formatCurrency(result.taxAmount, bill.currency)}
              </span>
            </div>
          )}

          {result.additionalFeeAmount > 0 && (
            <div className="flex justify-between">
              <span>Biaya Tambahan</span>
              <span className="font-semibold text-white">
                +{formatCurrency(result.additionalFeeAmount, bill.currency)}
              </span>
            </div>
          )}

          {result.roundingAdjustment !== 0 && (
            <div className="flex justify-between text-sky-300">
              <span>Penyesuaian Pembulatan</span>
              <span className="font-semibold">
                {result.roundingAdjustment > 0 ? "+" : ""}
                {formatCurrency(result.roundingAdjustment, bill.currency)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown per Participant */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Nominal Masing-Masing Peserta ({result.participants.length} Orang)
        </h3>

        <div className="space-y-2.5">
          {result.participants.map((p) => (
            <div
              key={p.participantId}
              className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                    <p className="text-[11px] text-slate-500">
                      {p.items.length} pesanan
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-slate-900">
                    {formatCurrency(p.finalTotal, bill.currency)}
                  </span>
                </div>
              </div>

              {/* Items ordered by participant */}
              <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                {p.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[200px] text-slate-700">
                      • {it.itemName}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(it.allocatedAmount, bill.currency)}
                    </span>
                  </div>
                ))}
                {(p.proportionalTax > 0 || p.proportionalService > 0) && (
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>• Pajak & Layanan</span>
                    <span>
                      +{formatCurrency(p.proportionalTax + p.proportionalService, bill.currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
