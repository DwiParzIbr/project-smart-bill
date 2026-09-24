"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  BillCalculationResult,
  BillData,
  CorporateReimbursementProfile,
} from "@/lib/types/bill";
import { downloadReimbursementExcel } from "@/lib/export/reimbursement-excel-generator";
import { PrintableReimbursementSlip } from "./printable-reimbursement-slip";
import {
  X,
  FileText,
  FileSpreadsheet,
  Printer,
  Building2,
  User,
  CreditCard,
  Briefcase,
  Camera,
  Eye,
  Check,
  Upload,
} from "lucide-react";

interface CorporateReimbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: BillData;
  result: BillCalculationResult;
  onUpdateReceiptImage?: (imageUrl: string) => void;
}

const STORAGE_KEY = "smart_bill_corporate_profile";

const EXPENSE_CATEGORIES = [
  "Makan Siang Tim (Team Lunch)",
  "Jamuan Klien / Mitra (Client Entertainment)",
  "Makan Lembur Karyawan (Overtime Meal)",
  "Perjalanan Dinas (Business Trip Meal)",
  "Rapat Kerja / Workshop (Meeting Refreshment)",
];

export function CorporateReimbursementModal({
  isOpen,
  onClose,
  bill,
  result,
  onUpdateReceiptImage,
}: CorporateReimbursementModalProps) {
  const [profile, setProfile] = useState<CorporateReimbursementProfile>({
    companyName: "",
    employeeName: "",
    employeeId: "",
    department: "",
    expenseCategory: "Makan Siang Tim (Team Lunch)",
    notes: "",
  });

  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const [receiptImage, setReceiptImage] = useState<string | null>(
    bill.receiptImageUrl || null
  );
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load profile from localStorage on open
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setProfile((prev) => ({
            ...prev,
            ...parsed,
            expenseCategory: parsed.expenseCategory || prev.expenseCategory,
          }));
        } else if (bill.reimbursementProfile) {
          setProfile(bill.reimbursementProfile);
        }
      } catch (e) {
        console.error("Failed to load corporate profile", e);
      }
    }
  }, [isOpen, bill.reimbursementProfile]);

  useEffect(() => {
    if (bill.receiptImageUrl) {
      setReceiptImage(bill.receiptImageUrl);
    }
  }, [bill.receiptImageUrl]);

  if (!isOpen) return null;

  const handleProfileChange = (
    key: keyof CorporateReimbursementProfile,
    val: string
  ) => {
    setProfile((prev) => {
      const updated = { ...prev, [key]: val };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save corporate profile", e);
      }
      return updated;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setReceiptImage(dataUrl);
        if (onUpdateReceiptImage) {
          onUpdateReceiptImage(dataUrl);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const handleDownloadExcel = () => {
    downloadReimbursementExcel(
      { ...bill, receiptImageUrl: receiptImage || undefined },
      result,
      profile
    );
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. Modal Dialog UI (Khusus Tampilan Layar / Screen Only - Hidden on Print) */}
      {/* ========================================================================= */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200 print:hidden"
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 my-4 sm:my-6 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header Modal */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-xs">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                  Klaim Reimburse Kantor (Corporate Expense)
                </h2>
                <p className="text-xs text-slate-500">
                  Ekspor dokumen formal A4 (PDF) & spreadsheet Excel untuk HRD/Finance
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition min-touch-target"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector: Form Data vs Pratinjau Dokumen */}
          <div className="flex border-b border-slate-200 px-4 pt-2 bg-slate-50/30 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("form")}
              className={`py-2 px-4 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
                activeTab === "form"
                  ? "border-indigo-600 text-indigo-700 bg-white shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Isi Data Pemohon</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`py-2 px-4 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
                activeTab === "preview"
                  ? "border-indigo-600 text-indigo-700 bg-white shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>2. Pratinjau Dokumen A4</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {activeTab === "form" ? (
              <div className="space-y-4">
                {/* Box Info */}
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-xs text-indigo-900 leading-relaxed">
                  💡 <span className="font-semibold">Info Otomatis:</span> Data perusahaan dan nama karyawan akan tersimpan di perangkat ini, sehingga untuk klaim berikutnya Anda tidak perlu mengetik ulang!
                </div>

                {/* Form Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Nama Perusahaan / Kantor</span>
                    </label>
                    <input
                      type="text"
                      value={profile.companyName}
                      onChange={(e) =>
                        handleProfileChange("companyName", e.target.value)
                      }
                      placeholder="Contoh: PT ASCON INOVASI DATA"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Nama Pemohon (Karyawan)</span>
                    </label>
                    <input
                      type="text"
                      value={profile.employeeName}
                      onChange={(e) =>
                        handleProfileChange("employeeName", e.target.value)
                      }
                      placeholder="Contoh: Dwifi Parizza Ibrahim"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>NIK / ID Karyawan (Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={profile.employeeId || ""}
                      onChange={(e) =>
                        handleProfileChange("employeeId", e.target.value)
                      }
                      placeholder="Contoh: IT-FARIZ-2026"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Departemen / Divisi
                    </label>
                    <input
                      type="text"
                      value={profile.department || ""}
                      onChange={(e) =>
                        handleProfileChange("department", e.target.value)
                      }
                      placeholder="Contoh: IT / Engineering / Operasional"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Kategori Pengeluaran */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kategori Pengeluaran
                  </label>
                  <select
                    value={profile.expenseCategory}
                    onChange={(e) =>
                      handleProfileChange("expenseCategory", e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-1.5"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Lainnya">Lainnya...</option>
                  </select>
                  {profile.expenseCategory === "Lainnya" && (
                    <input
                      type="text"
                      placeholder="Tuliskan kategori pengeluaran spesifik..."
                      onChange={(e) =>
                        handleProfileChange("expenseCategory", e.target.value)
                      }
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  )}
                </div>

                {/* Catatan / Keterangan Keperluan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Catatan / Keterangan Keperluan
                  </label>
                  <textarea
                    rows={2}
                    value={profile.notes || ""}
                    onChange={(e) => handleProfileChange("notes", e.target.value)}
                    placeholder="Contoh: Makan siang bersama penyambutan karyawan baru."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Lampiran Foto Struk Asli */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Lampiran Foto Struk Asli
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition active:scale-95 min-touch-target"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{receiptImage ? "Ganti Foto" : "Unggah Foto Struk"}</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  {receiptImage ? (
                    <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={receiptImage}
                        alt="Thumbnail Struk"
                        className="w-12 h-12 object-cover rounded-lg border border-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          Bukti Struk Fisik Terlampir
                        </p>
                        <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Akan dicetak di Halaman 2 dokumen
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">
                      Belum ada foto struk terlampir. Sangat disarankan untuk mengunggah foto struk asli agar klaim disetujui Finance.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Tab Preview Layar */
              <div className="bg-slate-100 p-2 sm:p-4 rounded-2xl border border-slate-200 overflow-x-auto print:hidden">
                <div className="shadow-lg bg-white rounded-lg p-2 max-w-[210mm] mx-auto scale-95 origin-top sm:scale-100">
                  <PrintableReimbursementSlip
                    bill={{ ...bill, receiptImageUrl: receiptImage || undefined }}
                    result={result}
                    profile={profile}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Hint Footer: Cara Simpan ke PDF */}
          <div className="px-4 sm:px-5 py-2 bg-indigo-50/60 border-t border-indigo-100/60 text-[11px] text-indigo-800 flex items-center gap-1.5 shrink-0">
            <Printer className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>
              Di kotak dialog cetak peramban, pilih tujuan <strong>&quot;Simpan sebagai PDF&quot; (Save as PDF)</strong> untuk mengunduh dokumen.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="flex-1 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-100 active:scale-98 text-slate-800 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition min-touch-target"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{copiedNotification ? "✓ File Excel (.xlsx) Diunduh!" : "Unduh Excel (.xlsx)"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition min-touch-target"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF (A4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Dedicated Print Portal (Attached directly to <body> for pure print)    */}
      {/* ========================================================================= */}
      {isMounted &&
        isOpen &&
        createPortal(
          <div id="corporate-reimbursement-print-area" className="hidden print:block">
            <PrintableReimbursementSlip
              bill={{ ...bill, receiptImageUrl: receiptImage || undefined }}
              result={result}
              profile={profile}
            />
          </div>,
          document.body
        )}
    </>
  );
}
