"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  CreditCard,
  Building2,
  Receipt,
  QrCode,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Info,
  Trash2,
  CheckCircle2,
  Briefcase,
  Share2,
  CalendarDays,
  FileSpreadsheet,
  Copy,
  Check,
  TrendingUp,
  Clock,
  ArrowUpRight,
  BarChart3,
  Calendar,
} from "lucide-react";
import { getAllBills, StoredBillRecord, clearAllBills } from "@/lib/storage/bill-storage";
import { HostPaymentProfile, CorporateReimbursementProfile } from "@/lib/types/bill";
import { PaymentProfileModal } from "@/components/bill/payment-profile-modal";
import { ConfirmDialog } from "@/components/ui/modal";
import { formatCurrency, formatDateIndonesian } from "@/lib/utils";
import {
  groupBillsByMonth,
  MonthSummary,
  exportMonthlyReportToExcel,
  generateMonthlyReportText,
} from "@/lib/reports/monthly-summary";

const PAYMENT_PROFILE_STORAGE_KEY = "smart_bill_payment_profile";
const CORPORATE_PROFILE_STORAGE_KEY = "smart_bill_corporate_profile";

export default function ProfilePage() {
  const [bills, setBills] = useState<StoredBillRecord[]>([]);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>("");
  const [paymentProfile, setPaymentProfile] = useState<HostPaymentProfile | null>(null);
  const [corporateProfile, setCorporateProfile] = useState<CorporateReimbursementProfile | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCorporateModal, setShowCorporateModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Corporate Profile edit state
  const [tempCorpProfile, setTempCorpProfile] = useState<CorporateReimbursementProfile>({
    companyName: "",
    employeeName: "",
    employeeId: "",
    department: "",
    expenseCategory: "Makan Siang Tim (Team Lunch)",
    notes: "",
  });

  useEffect(() => {
    // 1. Load bills count & total
    getAllBills().then((list) => setBills(list));

    // 2. Load payment profile
    try {
      const savedPay = localStorage.getItem(PAYMENT_PROFILE_STORAGE_KEY);
      if (savedPay) {
        setPaymentProfile(JSON.parse(savedPay));
      }
    } catch (e) {
      console.error("Failed to load payment profile", e);
    }

    // 3. Load corporate profile
    try {
      const savedCorp = localStorage.getItem(CORPORATE_PROFILE_STORAGE_KEY);
      if (savedCorp) {
        const parsed = JSON.parse(savedCorp);
        setCorporateProfile(parsed);
        setTempCorpProfile(parsed);
      }
    } catch (e) {
      console.error("Failed to load corporate profile", e);
    }
  }, []);

  const handleSavePaymentProfile = (newProfile: HostPaymentProfile) => {
    setPaymentProfile(newProfile);
    try {
      localStorage.setItem(PAYMENT_PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
    } catch (e) {
      console.error("Failed to save payment profile", e);
    }
  };

  const handleSaveCorporateProfile = () => {
    setCorporateProfile(tempCorpProfile);
    try {
      localStorage.setItem(CORPORATE_PROFILE_STORAGE_KEY, JSON.stringify(tempCorpProfile));
    } catch (e) {
      console.error("Failed to save corporate profile", e);
    }
    setShowCorporateModal(false);
    showNotice("Profil kantor berhasil disimpan!");
  };

  const handleClearAllData = async () => {
    await clearAllBills();
    setBills([]);
    setShowClearConfirm(false);
    showNotice("Riwayat tagihan berhasil dibersihkan!");
  };

  const showNotice = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  const totalSpent = bills.reduce((acc, b) => acc + (b.result?.finalGrandTotal || 0), 0);
  const totalPeople = bills.reduce((acc, b) => acc + (b.bill?.participants?.length || 0), 0);

  const monthlySummaries = React.useMemo(() => groupBillsByMonth(bills), [bills]);

  useEffect(() => {
    if (monthlySummaries.length > 0) {
      if (!selectedMonthKey || !monthlySummaries.some((m) => m.monthKey === selectedMonthKey)) {
        setSelectedMonthKey(monthlySummaries[0].monthKey);
      }
    } else {
      setSelectedMonthKey("");
    }
  }, [monthlySummaries, selectedMonthKey]);

  const activeMonthSummary = React.useMemo(() => {
    return monthlySummaries.find((m) => m.monthKey === selectedMonthKey) || monthlySummaries[0] || null;
  }, [monthlySummaries, selectedMonthKey]);

  const handleExportMonthExcel = (summary: MonthSummary) => {
    exportMonthlyReportToExcel(summary);
    showNotice(`Rekap ${summary.monthLabel} berhasil diunduh!`);
  };

  const handleCopyMonthText = (summary: MonthSummary) => {
    const text = generateMonthlyReportText(summary);
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showNotice(`Ringkasan ${summary.monthLabel} disalin ke clipboard!`);
      });
    } else {
      showNotice("Gagal menyalin ringkasan.");
    }
  };

  const displayName =
    paymentProfile?.hostName ||
    corporateProfile?.employeeName ||
    "Pengguna Smart Bill";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 pb-28 pt-4">
      <main className="max-w-xl mx-auto px-4 space-y-5">
        {/* Floating Notification */}
        {copiedNotification && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{copiedNotification}</span>
          </div>
        )}

        {/* User Profile Header Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-sky-100/60 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center gap-4 relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
              {initials || "SB"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-black text-slate-900 text-lg truncate">
                  {displayName}
                </h1>
                <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[10px] font-bold rounded-full border border-sky-200 shrink-0">
                  PWA User
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {corporateProfile?.companyName
                  ? `${corporateProfile.companyName} • ${corporateProfile.department || "Karyawan"}`
                  : "Smart Bill"}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Data tersimpan aman di perangkat lokal
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 text-center">
            <div className="p-2.5 bg-slate-50 rounded-2xl">
              <p className="text-[11px] text-slate-500 font-medium">Tagihan</p>
              <p className="text-base font-black text-slate-900 mt-0.5">{bills.length}</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-2xl">
              <p className="text-[11px] text-slate-500 font-medium">Teman Displit</p>
              <p className="text-base font-black text-slate-900 mt-0.5">{totalPeople} org</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-2xl">
              <p className="text-[11px] text-slate-500 font-medium">Total Dihitung</p>
              <p className="text-xs font-black text-sky-700 mt-1 truncate">
                {formatCurrency(totalSpent, "IDR")}
              </p>
            </div>
          </div>
        </div>

        {/* Section: Rekapan & Laporan Per Bulan */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  Rekapan & Laporan Per Bulan
                </h2>
                <p className="text-[11px] text-slate-500">
                  Ringkasan pengeluaran & status pelunasan bulanan
                </p>
              </div>
            </div>
            {activeMonthSummary && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {activeMonthSummary.monthLabel}
              </span>
            )}
          </div>

          {monthlySummaries.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                Belum ada data tagihan bulanan
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Setelah Anda membuat dan menyimpan tagihan, ringkasan pengeluaran per bulan akan otomatis tercatat di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Month Selector Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                {monthlySummaries.map((m) => (
                  <button
                    key={m.monthKey}
                    type="button"
                    onClick={() => setSelectedMonthKey(m.monthKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition min-touch-target ${
                      selectedMonthKey === m.monthKey
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {m.monthLabel} ({m.totalBills})
                  </button>
                ))}
              </div>

              {activeMonthSummary && (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Total Pengeluaran
                      </p>
                      <p className="text-sm sm:text-base font-black text-slate-900 mt-1 truncate">
                        {formatCurrency(activeMonthSummary.totalAmount, "IDR")}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Jumlah Tagihan
                      </p>
                      <p className="text-sm sm:text-base font-black text-slate-900 mt-1">
                        {activeMonthSummary.totalBills} sesi
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Pelunasan
                      </p>
                      <p className="text-sm sm:text-base font-black text-emerald-600 mt-1">
                        {activeMonthSummary.paidBills} / {activeMonthSummary.totalBills}{" "}
                        <span className="text-[10px] font-normal text-slate-500">Lunas</span>
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Rata-Rata / Sesi
                      </p>
                      <p className="text-sm sm:text-base font-black text-sky-700 mt-1 truncate">
                        {formatCurrency(activeMonthSummary.averagePerBill, "IDR")}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons: Export Excel & Copy WhatsApp */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleExportMonthExcel(activeMonthSummary)}
                      className="flex-1 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 active:scale-98 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 min-touch-target"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Unduh Excel ({activeMonthSummary.monthKey})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyMonthText(activeMonthSummary)}
                      className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 min-touch-target"
                      title="Salin Ringkasan Teks"
                    >
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Salin Ringkasan</span>
                    </button>
                  </div>

                  {/* List of bills in the active month */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Daftar Tagihan {activeMonthSummary.monthLabel}</span>
                      <Link href="/history" className="text-sky-600 hover:underline flex items-center gap-0.5 text-[11px]">
                        <span>Buka Semua Riwayat</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {activeMonthSummary.bills.map((b) => {
                        const isPaid = b.result.participants.every((p) => p.paymentStatus === "paid");
                        return (
                          <Link
                            key={b.id}
                            href={`/bill/${b.id}/result`}
                            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl flex items-center justify-between transition group"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-slate-900 truncate group-hover:text-sky-600 transition">
                                {b.bill.title}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {formatDateIndonesian(b.bill.date || b.updatedAt)} • {b.bill.participants.length} orang
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-xs font-black text-slate-900">
                                {formatCurrency(b.result.finalGrandTotal, b.bill.currency)}
                              </p>
                              <span
                                className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  isPaid
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {isPaid ? "Lunas" : "Belum Lunas"}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Section 1: Pengaturan Rekening & QRIS Penagih */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  Rekening & QRIS Penagih
                </h2>
                <p className="text-[11px] text-slate-500">
                  Untuk menerima transfer dari rekan saat bagi tagihan
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 rounded-xl transition min-touch-target"
            >
              {paymentProfile ? "Ubah" : "Atur"}
            </button>
          </div>

          {paymentProfile && paymentProfile.accounts.length > 0 ? (
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {paymentProfile.accounts.map((acc, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-sky-700 px-1.5 py-0.5 bg-sky-100 rounded">
                        {acc.provider}
                      </span>
                      <p className="text-xs font-bold text-slate-900 mt-1">
                        {acc.accountNumber}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        a.n {acc.accountHolder}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {paymentProfile.qrisImageUrl && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900">QRIS Tersimpan</p>
                      <p className="text-[10px] text-emerald-700">
                        Rekan dapat langsung scan QRIS Anda
                      </p>
                    </div>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={paymentProfile.qrisImageUrl}
                    alt="QRIS Preview"
                    className="w-10 h-10 object-contain rounded-lg border border-emerald-200 bg-white"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
              <p className="text-xs text-slate-500">
                Belum ada rekening atau QRIS tersimpan.
              </p>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="mt-2 text-xs font-bold text-sky-600 hover:underline"
              >
                + Tambah Rekening / Upload QRIS Sekarang
              </button>
            </div>
          )}
        </div>

        {/* Section 2: Profil Reimburse Kantor (Corporate Expense) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  Profil Klaim Kantor (Reimbursement)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Untuk otomatisasi cetak PDF A4 & Excel klaim HRD/Finance
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCorporateModal(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition min-touch-target"
            >
              {corporateProfile?.companyName ? "Ubah" : "Atur"}
            </button>
          </div>

          {corporateProfile?.companyName ? (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Perusahaan:</span>
                <span className="font-bold text-slate-900">{corporateProfile.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pemohon (Karyawan):</span>
                <span className="font-semibold text-slate-800">
                  {corporateProfile.employeeName || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NIK / ID Karyawan:</span>
                <span className="text-slate-800">{corporateProfile.employeeId || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Divisi / Dept:</span>
                <span className="text-slate-800">{corporateProfile.department || "Operasional"}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
              <p className="text-xs text-slate-500">
                Belum ada data profil kantor tersimpan.
              </p>
              <button
                onClick={() => setShowCorporateModal(true)}
                className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
              >
                + Atur Nama Kantor & NIK Karyawan
              </button>
            </div>
          )}
        </div>

        {/* Section 3: Data & Penyimpanan */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500" />
            <span>Penyimpanan & Pengaturan</span>
          </h2>

          <div className="space-y-2">
            <Link
              href="/history"
              className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition"
            >
              <div className="flex items-center gap-3">
                <Receipt className="w-4 h-4 text-slate-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Lihat Semua Riwayat</p>
                  <p className="text-[10px] text-slate-500">Kelola dan lihat tagihan lampau</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>

            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={bills.length === 0}
              className="w-full flex items-center justify-between p-3 hover:bg-rose-50 text-rose-600 rounded-2xl transition disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-4 h-4 text-rose-500" />
                <div className="text-left">
                  <p className="text-xs font-bold">Bersihkan Semua Riwayat</p>
                  <p className="text-[10px] text-rose-400">
                    Hapus {bills.length} tagihan yang tersimpan di perangkat ini
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        </div>

        {/* Section 4: Tentang Aplikasi */}
        <div className="text-center py-4 space-y-1">
          <p className="text-xs font-bold text-slate-600">
            Smart Bill
          </p>
          <p className="text-[11px] text-slate-400">
            Versi 1.2.0 • Progressive Web App (PWA)
          </p>
          <p className="text-[10px] text-slate-400">
            Dibuat untuk memudahkan pembagian biaya & reimburse kantor di Indonesia 🇮🇩
          </p>
        </div>
      </main>

      {/* Modal Pengaturan Rekening & QRIS */}
      <PaymentProfileModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        initialProfile={paymentProfile}
        onSave={handleSavePaymentProfile}
      />

      {/* Modal Edit Profil Kantor */}
      {showCorporateModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                Profil Klaim Kantor
              </h3>
              <button
                onClick={() => setShowCorporateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Perusahaan / Kantor
                </label>
                <input
                  type="text"
                  value={tempCorpProfile.companyName}
                  onChange={(e) =>
                    setTempCorpProfile({
                      ...tempCorpProfile,
                      companyName: e.target.value,
                    })
                  }
                  placeholder="Contoh: PT Maju Bersama"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Pemohon (Karyawan)
                </label>
                <input
                  type="text"
                  value={tempCorpProfile.employeeName}
                  onChange={(e) =>
                    setTempCorpProfile({
                      ...tempCorpProfile,
                      employeeName: e.target.value,
                    })
                  }
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIK / ID Karyawan
                  </label>
                  <input
                    type="text"
                    value={tempCorpProfile.employeeId || ""}
                    onChange={(e) =>
                      setTempCorpProfile({
                        ...tempCorpProfile,
                        employeeId: e.target.value,
                      })
                    }
                    placeholder="Contoh: EMP-12345"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Divisi / Dept
                  </label>
                  <input
                    type="text"
                    value={tempCorpProfile.department || ""}
                    onChange={(e) =>
                      setTempCorpProfile({
                        ...tempCorpProfile,
                        department: e.target.value,
                      })
                    }
                    placeholder="Contoh: Operasional / HRD"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCorporateModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCorporateProfile}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-bold text-white rounded-xl text-xs shadow-md"
              >
                Simpan Profil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Bersihkan Riwayat */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAllData}
        title="Bersihkan Semua Riwayat Tagihan?"
        description="Semua data tagihan dan catatan pelunasan yang tersimpan di perangkat ini akan dihapus secara permanen."
        confirmText="Ya, Hapus Semua"
        variant="danger"
      />
    </div>
  );
}
