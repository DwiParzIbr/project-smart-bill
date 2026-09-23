"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/mobile/stepper";
import { StickySummaryBar } from "@/components/bill/sticky-summary-bar";
import { StepInfo } from "@/components/bill/steps/step-info";
import { StepParticipants } from "@/components/bill/steps/step-participants";
import { StepItems } from "@/components/bill/steps/step-items";
import { StepAssignments } from "@/components/bill/steps/step-assignments";
import { StepCharges } from "@/components/bill/steps/step-charges";
import { StepReview } from "@/components/bill/steps/step-review";
import { BillData } from "@/lib/types/bill";
import { createDefaultBill } from "@/lib/storage/default-bill";
import {
  saveDraft,
  getDraft,
  clearDraft,
  saveCompletedBill,
} from "@/lib/storage/bill-storage";
import { calculateBill } from "@/lib/calculation/engine";
import { RotateCcw, ArrowLeft } from "lucide-react";
import { ConfirmDialog, AlertDialog } from "@/components/ui/modal";

const STEPS = [
  { id: 1, title: "Informasi", shortTitle: "Info" },
  { id: 2, title: "Peserta", shortTitle: "Peserta" },
  { id: 3, title: "Menu", shortTitle: "Menu" },
  { id: 4, title: "Pemesan", shortTitle: "Bagi" },
  { id: 5, title: "Pajak & Biaya", shortTitle: "Biaya" },
  { id: 6, title: "Review", shortTitle: "Review" },
];

export default function CreateBillPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [bill, setBill] = useState<BillData>(createDefaultBill());
  const [isLoaded, setIsLoaded] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant?: "warning" | "error" | "info";
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "warning",
  });

  // Load draft on mount
  useEffect(() => {
    getDraft().then((saved) => {
      if (saved && saved.items) {
        setBill(saved);
      }
      setIsLoaded(true);
    });
  }, []);

  // Auto-save draft on changes
  useEffect(() => {
    if (isLoaded) {
      saveDraft(bill);
    }
  }, [bill, isLoaded]);

  // Live estimated total for sticky bar
  const estimatedTotal = useMemo(() => {
    const calc = calculateBill(bill.participants, bill.items, bill.charges);
    return calc.finalGrandTotal;
  }, [bill]);

  const handleNext = async () => {
    if (currentStep === 1 && !bill.title.trim()) {
      setAlertConfig({
        isOpen: true,
        title: "Nama Tagihan Diperlukan",
        description: "Silakan masukkan nama acara, resto, atau tagihan sebelum melanjutkan.",
        variant: "warning",
      });
      return;
    }
    if (currentStep === 2 && bill.participants.length === 0) {
      setAlertConfig({
        isOpen: true,
        title: "Peserta Masih Kosong",
        description: "Tambahkan minimal 1 orang peserta yang ikut makan atau patungan.",
        variant: "warning",
      });
      return;
    }
    if (currentStep === 3 && bill.items.length === 0) {
      setAlertConfig({
        isOpen: true,
        title: "Menu Belum Ditambahkan",
        description: "Tambahkan minimal 1 menu pesanan beserta harganya sebelum melanjutkan.",
        variant: "warning",
      });
      return;
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Step 6 completed: finalize bill
      const finalResult = calculateBill(
        bill.participants,
        bill.items,
        bill.charges
      );
      const finalizedBill: BillData = {
        ...bill,
        status: "calculated",
        updatedAt: new Date().toISOString(),
      };

      await saveCompletedBill(finalizedBill, finalResult);
      await clearDraft();
      router.push(`/bill/${finalizedBill.id}/result`);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleResetDraft = () => {
    setShowResetConfirm(true);
  };

  const executeResetDraft = () => {
    clearDraft();
    setBill(createDefaultBill());
    setCurrentStep(1);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Stepper Progress Bar */}
      <Stepper
        currentStep={currentStep}
        steps={STEPS}
        onSelectStep={(step) => {
          if (step <= currentStep || bill.items.length > 0) {
            setCurrentStep(step);
          }
        }}
      />

      {/* Main Form Container */}
      <main className="max-w-xl mx-auto px-4 py-6">
        {/* Navigation & draft reset helper */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1.5 font-medium transition py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ke Beranda</span>
          </button>

          <button
            type="button"
            onClick={handleResetDraft}
            className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition py-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Form</span>
          </button>
        </div>

        {/* Dynamic Step View */}
        {currentStep === 1 && (
          <StepInfo
            bill={bill}
            onChange={(patch) => setBill((prev) => ({ ...prev, ...patch }))}
          />
        )}

        {currentStep === 2 && (
          <StepParticipants
            participants={bill.participants}
            onChange={(participants) =>
              setBill((prev) => ({ ...prev, participants }))
            }
          />
        )}

        {currentStep === 3 && (
          <StepItems
            items={bill.items}
            currency={bill.currency}
            onChange={(items) => setBill((prev) => ({ ...prev, items }))}
          />
        )}

        {currentStep === 4 && (
          <StepAssignments
            items={bill.items}
            participants={bill.participants}
            currency={bill.currency}
            onChange={(items) => setBill((prev) => ({ ...prev, items }))}
          />
        )}

        {currentStep === 5 && (
          <StepCharges
            charges={bill.charges}
            currency={bill.currency}
            onChange={(charges) => setBill((prev) => ({ ...prev, charges }))}
          />
        )}

        {currentStep === 6 && <StepReview bill={bill} />}
      </main>

      {/* Sticky Bottom Bar */}
      <StickySummaryBar
        itemCount={bill.items.length}
        participantCount={bill.participants.length}
        estimatedTotal={estimatedTotal}
        currentStep={currentStep}
        totalSteps={STEPS.length}
        onNext={handleNext}
        onBack={handleBack}
      />

      {/* Modern Reset Draft Confirmation Modal */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={executeResetDraft}
        title="Hapus Draft Tagihan?"
        description="Semua data nama tagihan, peserta, dan daftar menu yang sedang Anda isi akan dihapus dan formulir kembali ke awal. Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus Draft"
        cancelText="Batal"
        variant="danger"
      />

      {/* Modern Validation Alert Modal */}
      <AlertDialog
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        description={alertConfig.description}
        variant={alertConfig.variant}
      />
    </div>
  );
}
