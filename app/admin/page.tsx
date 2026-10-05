"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  LogOut,
  RefreshCw,
  Search,
  Download,
  Trash2,
  Calendar,
  Users,
  DollarSign,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Camera,
  FileText,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AdminTransactionRecord } from "@/lib/server/transaction-store";

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard state
  const [transactions, setTransactions] = useState<AdminTransactionRecord[]>([]);
  const [stats, setStats] = useState<{
    totalTransactions: number;
    totalVolume: number;
    totalParticipants: number;
    fullyPaidCount: number;
    partialPaidCount: number;
    pendingCount: number;
    scanCount: number;
    manualCount: number;
    avgTicket: number;
  } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "partial" | "pending">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "scan" | "manual">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest">("newest");

  // Selected Detail Modal
  const [selectedTx, setSelectedTx] = useState<AdminTransactionRecord | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // 1. Check existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch("/api/admin/me");
      if (res.ok) {
        setIsAuthenticated(true);
        loadTransactions();
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  // 2. Load transactions and stats
  const loadTransactions = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch("/api/admin/transactions");
      if (res.ok) {
        const json = await res.json();
        setTransactions(json.transactions || []);
        setStats(json.stats || null);
      } else if (res.status === 401) {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Gagal memuat transaksi admin:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  // 3. Handle login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setPasswordInput("");
        loadTransactions();
      } else {
        setLoginError(data.error || "Username atau password salah.");
      }
    } catch {
      setLoginError("Gagal menghubungi server. Periksa koneksi Anda.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 4. Handle logout
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    setIsAuthenticated(false);
    setTransactions([]);
    setStats(null);
  };

  // 5. Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        if (selectedTx?.id === id) setSelectedTx(null);
        setDeleteTargetId(null);
        loadTransactions();
      }
    } catch (err) {
      console.error("Gagal menghapus transaksi:", err);
    }
  };

  // 6. Export transactions to CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = [
      "ID Transaksi",
      "Judul Tagihan",
      "Tanggal",
      "Waktu Dibuat",
      "Sumber",
      "Jumlah Menu",
      "Jumlah Peserta",
      "Total Subtotal",
      "Pajak",
      "Servis",
      "Diskon",
      "Grand Total",
      "Status Pelunasan",
      "Peserta Sudah Bayar",
    ];

    const rows = filteredTransactions.map((tx) => [
      `"${tx.id}"`,
      `"${tx.title.replace(/"/g, '""')}"`,
      `"${tx.date}"`,
      `"${tx.createdAt}"`,
      `"${tx.source === "scan" ? "Scan Struk" : "Manual"}"`,
      tx.itemCount,
      tx.participantCount,
      tx.subtotal,
      tx.tax,
      tx.service,
      tx.discount,
      tx.grandTotal,
      `"${tx.status === "paid" ? "Lunas" : tx.status === "partial" ? "Sebagian" : "Belum Bayar"}"`,
      `"${tx.paidCount}/${tx.participantCount}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `laporan_transaksi_smart_bill_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered & sorted transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = tx.title.toLowerCase().includes(q);
          const matchesId = tx.id.toLowerCase().includes(q);
          const matchesItem = tx.items.some((it) => it.name.toLowerCase().includes(q));
          const matchesPerson = tx.participants.some((p) => p.name.toLowerCase().includes(q));
          if (!matchesTitle && !matchesId && !matchesItem && !matchesPerson) return false;
        }

        // Status filter
        if (statusFilter !== "all" && tx.status !== statusFilter) {
          return false;
        }

        // Source filter
        if (sourceFilter !== "all" && tx.source !== sourceFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "highest") {
          return b.grandTotal - a.grandTotal;
        }
        return 0;
      });
  }, [transactions, searchQuery, statusFilter, sourceFilter, sortBy]);

  // Loading initial state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-sky-600" />
          <span className="text-slate-600 text-sm font-medium">Memverifikasi Portal Admin...</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 1. ADMIN LOGIN VIEW (Sesuaikan dengan Desain Website)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 selection:bg-sky-500 selection:text-white">
        <div className="w-full max-w-md space-y-6">
          {/* Logo & Portal Branding */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center mb-1">
              <img
                src="/logo.png"
                alt="Smart Bill Logo"
                className="w-14 h-14 rounded-2xl shadow-sm object-cover"
              />
            </div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Smart Bill
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold">
                <Shield className="w-3 h-3 text-sky-600" />
                <span>Portal Admin</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Area khusus pengelola. Masuk untuk mengawasi seluruh riwayat transaksi tagihan sistem.
            </p>
          </div>

          {/* Form Card (White Rounded-3xl Card) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            {loginError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="font-medium">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {/* Username Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-username"
                  className="block text-xs font-bold text-slate-700"
                >
                  Username Admin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Masukkan username admin"
                    enterKeyHint="next"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition min-touch-target"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-bold text-slate-700"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    enterKeyHint="done"
                    className="w-full pl-10 pr-12 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition min-touch-target"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                    aria-label={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>


              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoggingIn || !usernameInput || !passwordInput}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl shadow-sm shadow-sky-600/20 active:scale-98 transition flex items-center justify-center gap-2 min-touch-target mt-2"
              >
                {isLoggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi Akses...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Masuk ke Dashboard Admin</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            Smart Bill Enterprise &bull; Enkripsi Sesi Aktif
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. ADMIN DASHBOARD VIEW (Menyatu Sempurna dengan Website)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 selection:bg-sky-500 selection:text-white">
      {/* Top Admin Navbar (White Header Identik dengan Website) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Smart Bill Logo"
              className="w-9 h-9 rounded-xl shadow-xs object-cover"
            />
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-lg">
                Smart Bill
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-bold">
                <Shield className="w-3 h-3 text-sky-600" />
                <span>Admin</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={loadTransactions}
              disabled={isLoadingData}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 min-touch-target"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? "animate-spin text-sky-600" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-700 border border-sky-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 min-touch-target"
              title="Unduh Data CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 min-touch-target"
              title="Keluar dari Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Pusat Data Transaksi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Rekapitulasi seluruh tagihan yang dibuat oleh pengguna secara realtime.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sinkronisasi Otomatis Aktif</span>
          </div>
        </div>

        {/* 📊 STATS OVERVIEW CARDS */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Grand Total Hero Card (Mirip Card Hasil Split di result page) */}
            <div className="p-5 bg-gradient-to-tr from-slate-900 via-slate-800 to-sky-950 text-white rounded-3xl shadow-sm space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span className="text-sky-400 uppercase tracking-wider text-[11px]">
                  Total Perputaran Uang
                </span>
                <div className="p-1.5 rounded-xl bg-white/10 text-white">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">
                  {formatCurrency(stats.totalVolume)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Rata-rata: <span className="text-sky-300 font-semibold">{formatCurrency(stats.avgTicket)}</span>
                </div>
              </div>
            </div>

            {/* Total Tagihan Card */}
            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Tagihan</span>
                <div className="p-1.5 rounded-xl bg-sky-50 text-sky-600">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {stats.totalTransactions}{" "}
                  <span className="text-xs font-medium text-slate-500">Tagihan</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <span className="font-semibold text-sky-700">📷 {stats.scanCount} Scan</span>
                  <span>•</span>
                  <span>✍️ {stats.manualCount} Manual</span>
                </div>
              </div>
            </div>

            {/* Total Peserta Card */}
            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Peserta</span>
                <div className="p-1.5 rounded-xl bg-teal-50 text-teal-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {stats.totalParticipants}{" "}
                  <span className="text-xs font-medium text-slate-500">Orang</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Orang yang ikut patungan
                </p>
              </div>
            </div>

            {/* Status Pelunasan Card */}
            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Status Pelunasan</span>
                <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600">
                  {stats.fullyPaidCount}{" "}
                  <span className="text-xs font-medium text-slate-500">Lunas</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <span className="text-amber-600 font-semibold">{stats.partialPaidCount} Sebagian</span>
                  <span>•</span>
                  <span className="text-slate-500">{stats.pendingCount} Belum</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🔍 FILTERS & CONTROLS */}
        <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama resto, acara, menu, atau peserta..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 min-touch-target"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="highest">Nominal Terbesar</option>
            </select>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-bold mr-1">Status:</span>
            {[
              { id: "all", label: "Semua" },
              { id: "paid", label: "Lunas" },
              { id: "partial", label: "Sebagian" },
              { id: "pending", label: "Belum Bayar" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-touch-target ${
                  statusFilter === st.id
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                }`}
              >
                {st.label}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            <span className="text-[11px] text-slate-500 font-bold mr-1">Sumber:</span>
            {[
              { id: "all", label: "Semua" },
              { id: "scan", label: "📷 Scan Struk" },
              { id: "manual", label: "✍️ Manual" },
            ].map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSourceFilter(sc.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-touch-target ${
                  sourceFilter === sc.id
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* 📋 TRANSACTIONS LIST */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Daftar Transaksi Pengguna</h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-xs font-bold">
                {filteredTransactions.length}
              </span>
            </div>
            <span className="text-xs text-slate-400">Klik kartu untuk rincian</span>
          </div>

          {isLoadingData ? (
            <div className="p-16 text-center bg-white border border-slate-200 rounded-3xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto" />
              <p className="text-xs text-slate-500 mt-3 font-semibold">Memuat data transaksi terbaru...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-14 text-center bg-white border border-dashed border-slate-200 rounded-3xl space-y-2.5">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Tidak ada transaksi ditemukan</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || statusFilter !== "all" || sourceFilter !== "all"
                  ? "Coba sesuaikan kata kunci pencarian atau filter status yang dipilih."
                  : "Belum ada transaksi tagihan yang tercatat di server."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 sm:p-5 bg-white border border-slate-200 hover:border-sky-300 hover:shadow-xs rounded-3xl transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group min-touch-target"
                >
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-sky-700 transition truncate">
                        {tx.title}
                      </h3>

                      {/* Source Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold border border-slate-200">
                        {tx.source === "scan" ? (
                          <>
                            <Camera className="w-3 h-3 text-sky-600" />
                            <span>Scan Struk</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-3 h-3 text-slate-500" />
                            <span>Manual</span>
                          </>
                        )}
                      </span>

                      {/* Status Badge */}
                      {tx.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Lunas</span>
                        </span>
                      ) : tx.status === "partial" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          <span>Sebagian ({tx.paidCount}/{tx.participantCount})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          <span>Belum Bayar</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{tx.date}</span>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{tx.participantCount} Orang</span>
                      </span>
                      <span>&bull;</span>
                      <span>{tx.itemCount} Menu</span>
                      <span>&bull;</span>
                      <span className="font-mono text-[11px] text-slate-400 truncate max-w-[120px]">
                        ID: {tx.id}
                      </span>
                    </div>
                  </div>

                  {/* Right: Nominal & Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="text-base sm:text-lg font-black text-slate-900">
                        {formatCurrency(tx.grandTotal, tx.currency)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {tx.paidCount} dari {tx.participantCount} lunas
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTx(tx);
                        }}
                        className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                      >
                        Detail
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetId(tx.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ===================================================================== */}
      {/* 3. TRANSACTION DETAIL MODAL (Light Web Theme) */}
      {/* ===================================================================== */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 w-full max-w-2xl max-h-[90dvh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-700 rounded-xl border border-sky-100">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Rincian Transaksi Tagihan</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedTx.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition min-touch-target flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-sm">
              {/* Grand Total Hero Banner (Identik dengan Result Page) */}
              <div className="p-5 bg-gradient-to-tr from-slate-900 via-slate-800 to-sky-950 text-white rounded-3xl shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs text-sky-400 uppercase tracking-wider font-semibold">
                    Grand Total Tagihan
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                    {formatCurrency(selectedTx.grandTotal, selectedTx.currency)}
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    {selectedTx.title} &bull; {selectedTx.date}
                  </div>
                </div>

                <div className="text-right">
                  {selectedTx.status === "paid" ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Semua Lunas</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{selectedTx.paidCount}/{selectedTx.participantCount} Lunas</span>
                    </span>
                  )}
                  <div className="text-[11px] text-slate-300 mt-1.5 font-medium">
                    Sumber: {selectedTx.source === "scan" ? "📷 Scan Struk" : "✍️ Manual"}
                  </div>
                </div>
              </div>

              {/* Receipt Image if available */}
              {selectedTx.receiptImageUrl && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Foto Struk Asli
                  </h4>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center max-h-60 overflow-hidden">
                    <img
                      src={selectedTx.receiptImageUrl}
                      alt="Foto Struk"
                      className="max-h-56 object-contain rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Breakdown Menu Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Daftar Menu ({selectedTx.items.length})
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">
                    Subtotal: {formatCurrency(selectedTx.subtotal, selectedTx.currency)}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200">
                  {selectedTx.items.map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{it.name}</div>
                        <div className="text-slate-500 text-[11px]">
                          {it.quantity}x @ {formatCurrency(it.unitPrice, selectedTx.currency)}
                        </div>
                      </div>
                      <div className="font-bold text-slate-900">
                        {formatCurrency(it.totalPrice, selectedTx.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charges summary */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Pajak (Tax):</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(selectedTx.tax, selectedTx.currency)}
                  </span>
                </div>
                {selectedTx.service > 0 && (
                  <div className="flex justify-between">
                    <span>Biaya Layanan (Service):</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(selectedTx.service, selectedTx.currency)}
                    </span>
                  </div>
                )}
                {selectedTx.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Diskon:</span>
                    <span className="font-bold">
                      -{formatCurrency(selectedTx.discount, selectedTx.currency)}
                    </span>
                  </div>
                )}
              </div>

              {/* Participants Breakdown & Payment Status */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rincian Pembagian Per Orang ({selectedTx.participants.length})
                </h4>
                <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                  {selectedTx.participants.map((p, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{p.name}</span>
                        {p.paymentStatus === "paid" ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                            ✓ Lunas
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[10px] font-bold">
                            ⏳ Belum Bayar
                          </span>
                        )}
                      </div>
                      <div className="font-black text-slate-900 text-sm">
                        {formatCurrency(p.amount, selectedTx.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 max-w-sm w-full p-6 rounded-3xl space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Hapus Transaksi Ini?</h3>
              <p className="text-xs text-slate-500">
                Data transaksi ID <span className="font-mono text-slate-700 font-bold">{deleteTargetId}</span> akan dihapus dari daftar arsip admin.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition min-touch-target"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTransaction(deleteTargetId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition min-touch-target"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
