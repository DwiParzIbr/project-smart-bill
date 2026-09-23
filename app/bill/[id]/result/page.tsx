"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getBillById,
  updatePaymentStatus,
  markAllParticipantsPaymentStatus,
  getHostPaymentProfile,
  saveHostPaymentProfile,
  saveCompletedBill,
  StoredBillRecord,
} from "@/lib/storage/bill-storage";
import { formatCurrency } from "@/lib/utils";
import { shareBill, generateWhatsAppSummary } from "@/lib/sharing/share-utils";
import {
  BillPayer,
  HostPaymentProfile,
  ParticipantCalculation,
} from "@/lib/types/bill";
import { PaymentProfileModal } from "@/components/bill/payment-profile-modal";
import { QRISPreviewModal } from "@/components/bill/qris-preview-modal";
import { PersonalShareModal } from "@/components/bill/personal-share-modal";
import { DebtSimplificationCard } from "@/components/bill/debt-simplification-card";
import { ReceiptCardModal } from "@/components/bill/receipt-card-modal";
import { ConfirmDialog } from "@/components/ui/modal";
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
  CreditCard,
  QrCode,
  MessageCircle,
  ExternalLink,
  Settings,
  Filter,
  Users,
  Repeat,
} from "lucide-react";

export default function BillResultPage() {
  const params = useParams();
  const router = useRouter();
  const billId = params.id as string;

  const [record, setRecord] = useState<StoredBillRecord | null>(null);
  const [profile, setProfile] = useState<HostPaymentProfile | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedAccIndex, setCopiedAccIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter & bulk action state
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid">("all");
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkActionTarget, setBulkActionTarget] = useState<"paid" | "pending">("paid");

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [showReceiptCardModal, setShowReceiptCardModal] = useState(false);
  const [sharingParticipant, setSharingParticipant] = useState<ParticipantCalculation | null>(null);

  useEffect(() => {
    if (!billId) return;
    getBillById(billId).then((data) => {
      setRecord(data);
      setLoading(false);
    });

    const savedProfile = getHostPaymentProfile();
    if (savedProfile) {
      setProfile(savedProfile);
    }
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

  const handleExecuteBulkAction = async () => {
    setShowBulkConfirm(false);
    const updated = await markAllParticipantsPaymentStatus(billId, bulkActionTarget);
    if (updated) {
      setRecord({ ...updated });
      if (bulkActionTarget === "paid") {
        triggerConfetti();
      }
    }
  };

  const handleSaveProfile = (newProfile: HostPaymentProfile) => {
    saveHostPaymentProfile(newProfile);
    setProfile(newProfile);
  };

  const handleUpdatePayers = async (payers: BillPayer[]) => {
    if (!record) return;
    record.bill.payers = payers;
    await saveCompletedBill(record.bill, record.result);
    setRecord({ ...record });
  };

  const handleCopyAccount = async (accountNumber: string, index: number) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(accountNumber);
      setCopiedAccIndex(index);
      setTimeout(() => setCopiedAccIndex(null), 2200);
    }
  };

  const handleShare = async () => {
    if (!record) return;
    const res = await shareBill(record.bill, record.result, profile);
    if (res.method === "clipboard") {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    }
  };

  const handleCopySummaryText = async () => {
    if (!record) return;
    const text = generateWhatsAppSummary(record.bill, record.result, profile);
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
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
  const totalCount = result.participants.length;
  const paidParticipants = result.participants.filter(
    (p) => p.paymentStatus === "paid"
  );
  const paidCount = paidParticipants.length;
  const pendingCount = totalCount - paidCount;
  const allPaid = totalCount > 0 && paidCount === totalCount;

  // Amount collected
  const collectedAmount = paidParticipants.reduce(
    (sum, p) => sum + p.finalTotal,
    0
  );
  const percentCollected =
    result.finalGrandTotal > 0
      ? Math.min(100, Math.round((collectedAmount / result.finalGrandTotal) * 100))
      : 0;

  // Filter participants
  const filteredParticipants = result.participants.filter((p) => {
    if (filterStatus === "paid") return p.paymentStatus === "paid";
    if (filterStatus === "pending") return p.paymentStatus === "pending";
    return true;
  });

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
              {bill.date} • {totalCount} Orang
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
                {paidCount} / {totalCount} Lunas
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Share, Aesthetic Card & Copy */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={handleShare}
            className="py-3 px-4 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm min-touch-target"
          >
            <Share2 className="w-4 h-4" />
            <span>Bagikan Semua</span>
          </button>

          <button
            onClick={() => setShowReceiptCardModal(true)}
            className="py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-98 text-white font-bold rounded-2xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 text-sm min-touch-target"
          >
            <Receipt className="w-4 h-4" />
            <span>Struk Estetik</span>
          </button>

          <button
            onClick={handleCopySummaryText}
            className="py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 active:scale-98 text-slate-800 font-bold rounded-2xl shadow-xs transition flex items-center justify-center gap-2 text-sm min-touch-target"
          >
            {copiedSummary ? (
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

        {/* 🔄 Feature 5: Multi-Payer Debt Simplification Card */}
        <DebtSimplificationCard
          bill={bill}
          participants={result.participants}
          onUpdatePayers={handleUpdatePayers}
        />

        {/* 💳 Feature 1: Host Payment Info & QRIS Card */}
        <div className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tujuan Transfer Penagih
                </h3>
                <p className="text-[11px] text-slate-500">
                  {profile?.hostName ? `a.n ${profile.hostName}` : "Rekening & QRIS untuk teman transfer"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition min-touch-target"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{profile?.accounts?.length ? "Ubah" : "Atur"}</span>
            </button>
          </div>

          {profile && (profile.accounts.length > 0 || profile.qrisImageUrl) ? (
            <div className="space-y-2.5 pt-1">
              {/* Account chips */}
              {profile.accounts.map((acc, idx) => (
                <div
                  key={acc.id || idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-black rounded-md">
                        {acc.provider}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900 truncate">
                        {acc.accountNumber}
                      </span>
                    </div>
                    {acc.accountHolder && (
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        a.n {acc.accountHolder}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyAccount(acc.accountNumber, idx)}
                    className="py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs transition active:scale-95 shrink-0 min-touch-target"
                  >
                    {copiedAccIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              ))}

              {/* QRIS Thumbnail Banner if exists */}
              {profile.qrisImageUrl && (
                <div
                  onClick={() => setShowQrisModal(true)}
                  className="flex items-center justify-between p-2.5 bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-200 rounded-2xl cursor-pointer hover:border-sky-300 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profile.qrisImageUrl}
                      alt="QRIS Thumbnail"
                      className="w-10 h-10 object-cover rounded-xl border border-sky-300 shadow-2xs"
                    />
                    <div>
                      <span className="text-xs font-bold text-sky-950 flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5 text-sky-600" />
                        QRIS Pembayaran Siap
                      </span>
                      <p className="text-[11px] text-sky-700">
                        Klik untuk memperbesar & scan QRIS
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-sky-700 group-hover:underline pr-1">
                    Lihat ➔
                  </span>
                </div>
              )}

              {profile.customNotes && (
                <p className="text-[11px] text-slate-500 italic px-1">
                  * {profile.customNotes}
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-1.5">
              <p className="text-xs text-slate-600">
                Belum ada rekening atau QRIS tersimpan.
              </p>
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="text-xs font-bold text-sky-600 hover:underline inline-flex items-center gap-1"
              >
                <span>+ Masukkan Rekening / QRIS Sekarang</span>
              </button>
            </div>
          )}
        </div>

        {/* 📊 Feature 3: Settlement Tracker Progress Card */}
        <div className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pelacak Pelunasan
              </span>
              <h2 className="text-base font-black text-slate-900 mt-0.5">
                {formatCurrency(collectedAmount, bill.currency)} /{" "}
                {formatCurrency(result.finalGrandTotal, bill.currency)}
              </h2>
            </div>

            <div className="text-right">
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                {percentCollected}% Terkumpul
              </span>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentCollected}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
            <span>{paidCount} dari {totalCount} orang sudah transfer</span>
            <button
              type="button"
              onClick={() => {
                setBulkActionTarget(allPaid ? "pending" : "paid");
                setShowBulkConfirm(true);
              }}
              className="text-sky-600 hover:text-sky-700 font-bold hover:underline min-touch-target"
            >
              {allPaid ? "Reset Semua Belum Lunas" : "Tandai Semua Lunas"}
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl pt-1">
            {[
              { id: "all", label: `Semua (${totalCount})` },
              { id: "pending", label: `Belum (${pendingCount})` },
              { id: "paid", label: `Lunas (${paidCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id as any)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition min-touch-target ${
                  filterStatus === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 👥 Feature 2 & 3: Participants Breakdown Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rincian Per Orang ({filteredParticipants.length})
            </h2>
            {filterStatus !== "all" && (
              <button
                onClick={() => setFilterStatus("all")}
                className="text-[11px] font-bold text-sky-600 hover:underline"
              >
                Tampilkan Semua
              </button>
            )}
          </div>

          {filteredParticipants.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">
                Tidak ada peserta dengan status ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredParticipants.map((p) => {
                const isPaid = p.paymentStatus === "paid";

                return (
                  <div
                    key={p.participantId}
                    className={`p-4 rounded-3xl border transition-all ${
                      isPaid
                        ? "bg-emerald-50/40 border-emerald-200 shadow-2xs"
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

                    {/* Action Row: Send WA & Payment Toggle */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSharingParticipant(p)}
                        className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 min-touch-target"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kirim WA</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTogglePayment(p.participantId)}
                        className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 min-touch-target ${
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
          )}
        </div>
      </main>

      {/* Feature 1 Modals */}
      <PaymentProfileModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        initialProfile={profile}
        onSave={handleSaveProfile}
      />

      <QRISPreviewModal
        isOpen={showQrisModal}
        onClose={() => setShowQrisModal(false)}
        qrisImageUrl={profile?.qrisImageUrl}
        hostName={profile?.hostName}
      />

      {/* Feature 2 Modal: Personal WhatsApp Share */}
      <PersonalShareModal
        isOpen={!!sharingParticipant}
        onClose={() => setSharingParticipant(null)}
        bill={bill}
        participant={sharingParticipant}
        profile={profile}
      />

      {/* Feature 3: Bulk Action Confirm Dialog */}
      <ConfirmDialog
        isOpen={showBulkConfirm}
        onClose={() => setShowBulkConfirm(false)}
        onConfirm={handleExecuteBulkAction}
        title={
          bulkActionTarget === "paid"
            ? "Tandai Semua Sudah Lunas?"
            : "Reset Status Pelunasan?"
        }
        description={
          bulkActionTarget === "paid"
            ? "Semua peserta akan ditandai lunas dan total pembayaran tercatat telah terkumpul 100%."
            : "Semua peserta akan dikembalikan ke status 'Belum Bayar'."
        }
        confirmText={
          bulkActionTarget === "paid"
            ? "Ya, Tandai Semua Lunas"
            : "Ya, Reset Status"
        }
        variant={bulkActionTarget === "paid" ? "primary" : "warning"}
      />

      {/* Feature 7: Aesthetic Receipt Card Modal */}
      <ReceiptCardModal
        isOpen={showReceiptCardModal}
        onClose={() => setShowReceiptCardModal(false)}
        bill={bill}
        result={result}
      />
    </div>
  );
}
