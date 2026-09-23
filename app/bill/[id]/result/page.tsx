"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getBillById,
  updatePaymentStatus,
  StoredBillRecord,
} from "@/lib/storage/bill-storage";
import { formatCurrency } from "@/lib/utils";
import { shareBill, generateWhatsAppSummary } from "@/lib/sharing/share-utils";
import confetti from "canvas-confetti";
import {
  Share2,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Receipt,
  PartyPopper,
  Sparkles,
} from "lucide-react";

export default function BillResultPage() {
  const params = useParams();
  const router = useRouter();
  const billId = params.id as string;

  const [record, setRecord] = useState<StoredBillRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!billId) return;
    getBillById(billId).then((data) => {
      setRecord(data);
      setLoading(false);
    });
  }, [billId]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const handleTogglePayment = async (participantId: string) => {
    if (!record) return;

    const participant = record.result.participants.find(
      (p) => p.participantId === participantId
    );
    if (!participant) return;

    const newStatus =
      participant.paymentStatus === "paid" ? "pending" : "paid";

    await updatePaymentStatus(billId, participantId, newStatus);

    // Refresh record
    const updated = await getBillById(billId);
    if (updated) {
      setRecord({ ...updated });
      const allPaid = updated.result.participants.every(
        (p) => p.paymentStatus === "paid"
      );
      if (allPaid && newStatus === "paid") {
        triggerConfetti();
      }
    }
  };

  const handleShare = async () => {
    if (!record) return;
    const res = await shareBill(record.bill, record.result);
    if (res.method === "clipboard") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyText = async () => {
    if (!record) return;
    const text = generateWhatsAppSummary(record.bill, record.result);
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-center">
        <Receipt className="w-12 h-12 text-slate-400 mb-3" />
        <h2 className="text-lg font-bold text-slate-800">
          Tagihan Tidak Ditemukan
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-xs mb-4">
          Tagihan ini mungkin telah dihapus atau disimpan di perangkat lain.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2.5 bg-sky-600 text-white font-semibold rounded-xl text-sm"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const { bill, result } = record;
  const allPaid = result.participants.every((p) => p.paymentStatus === "paid");
  const paidCount = result.participants.filter(
    (p) => p.paymentStatus === "paid"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-28 pt-4">
      <main className="max-w-xl mx-auto px-4 space-y-5">
        {/* Top bar back */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/history")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 min-touch-target"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Lihat Riwayat</span>
          </button>

          {allPaid && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              <PartyPopper className="w-3.5 h-3.5" />
              <span>Semua Lunas!</span>
            </div>
          )}
        </div>

        {/* Grand Total Hero Card */}
        <div className="p-5 sm:p-6 bg-gradient-to-tr from-slate-900 via-slate-800 to-sky-950 text-white rounded-3xl shadow-xl space-y-4">
          <div>
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              Hasil Pembagian Tagihan
            </span>
            <h1 className="text-xl sm:text-2xl font-black mt-0.5 tracking-tight">
              {bill.title}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {bill.date} • {result.participants.length} Orang
            </p>
          </div>

          <div className="pt-3 border-t border-slate-700 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400">Total Tagihan</span>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-0.5">
                {formatCurrency(result.finalGrandTotal, bill.currency)}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Status Bayar</span>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {paidCount} / {result.participants.length} Lunas
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Share & Copy */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleShare}
            className="py-3 px-4 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm min-touch-target"
          >
            <Share2 className="w-4 h-4" />
            <span>Bagikan Tagihan</span>
          </button>

          <button
            onClick={handleCopyText}
            className="py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 active:scale-98 text-slate-800 font-bold rounded-2xl shadow-xs transition flex items-center justify-center gap-2 text-sm min-touch-target"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Salin Teks WA</span>
              </>
            )}
          </button>
        </div>

        {/* Participants Breakdown Cards */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Rincian Pembayaran Masing-Masing
          </h2>

          <div className="space-y-3">
            {result.participants.map((p) => {
              const isPaid = p.paymentStatus === "paid";

              return (
                <div
                  key={p.participantId}
                  className={`p-4 rounded-3xl border transition-all ${
                    isPaid
                      ? "bg-emerald-50/50 border-emerald-300 shadow-xs"
                      : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                          isPaid
                            ? "bg-emerald-600 text-white"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {p.items.length} Menu dipesan
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg sm:text-xl font-black text-slate-900">
                        {formatCurrency(p.finalTotal, bill.currency)}
                      </div>
                      <span
                        className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                          isPaid
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isPaid ? "✓ Lunas" : "⏳ Belum Bayar"}
                      </span>
                    </div>
                  </div>

                  {/* Itemized breakdown */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    {p.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-slate-700">• {it.itemName}</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(it.allocatedAmount, bill.currency)}
                        </span>
                      </div>
                    ))}
                    {(p.proportionalTax > 0 || p.proportionalService > 0) && (
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>• Pajak & Layanan</span>
                        <span>
                          +{formatCurrency(
                            p.proportionalTax + p.proportionalService,
                            bill.currency
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Mark as Paid Toggle Button */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleTogglePayment(p.participantId)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition min-touch-target ${
                        isPaid
                          ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Tandai Belum Lunas</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Tandai Sudah Bayar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
