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
  TrendingUp,
  CreditCard,
  ChevronDown,
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

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_transaksi_smart_bill_${new Date().toISOString().split("T")[0]}.csv`);
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-2 border-sky-500 border-t-transparent" />
          <span className="text-slate-400 text-sm font-medium">Memverifikasi Portal Admin...</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 1. ADMIN LOGIN VIEW (Hidden & Secure)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 selection:bg-sky-500 selection:text-white">
        <div className="w-full max-w-md">
          {/* Logo & Portal Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shadow-xl shadow-sky-500/10 mb-3">
              <Shield className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Smart Bill Admin Portal
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Area khusus pengelola. Masuk untuk mengawasi seluruh data transaksi tagihan sistem.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
            {loginError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-400 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4.5" noValidate>
              {/* Username Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-username"
                  className="block text-xs font-bold text-slate-300"
                >
                  Username Admin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition min-touch-target"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-bold text-slate-300"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
                    className="w-full pl-10 pr-12 py-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition min-touch-target"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
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

              {/* Hint badge */}
              <div className="pt-1">
                <p className="text-[11px] text-slate-500 text-center">
                  Akses bawaan sistem: <span className="text-slate-400 font-mono">admin / admin123</span>
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoggingIn || !usernameInput || !passwordInput}
                className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl shadow-lg shadow-sky-600/20 active:scale-98 transition flex items-center justify-center gap-2 min-touch-target mt-2"
              >
                {isLoggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

          <p className="text-[11px] text-slate-600 text-center mt-6">
            Smart Bill Enterprise &bull; Enkripsi Sesi Aktif
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. ADMIN DASHBOARD VIEW
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-sky-500 selection:text-white">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base tracking-tight">
                  Smart Bill Admin
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Monitoring transaksi lintas pengguna
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={loadTransactions}
              disabled={isLoadingData}
              className="p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5 min-touch-target"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? "animate-spin text-sky-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="p-2 sm:px-3 sm:py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5 min-touch-target"
              title="Unduh Data CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-xl transition flex items-center gap-1.5 min-touch-target"
              title="Keluar dari Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Page Title & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pusat Data Transaksi
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Rekapitulasi seluruh tagihan yang dibuat oleh pengguna, baik via scan struk maupun input manual.
            </p>
          </div>
        </div>

        {/* 📊 STATS OVERVIEW CARDS */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Volume */}
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Perputaran</span>
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-black text-white truncate">
                {formatCurrency(stats.totalVolume)}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>Rata-rata:</span>
                <span className="text-sky-400 font-semibold">{formatCurrency(stats.avgTicket)}</span>
              </div>
            </div>

            {/* Total Transaksi */}
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Tagihan</span>
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-black text-white">
                {stats.totalTransactions}{" "}
                <span className="text-xs font-normal text-slate-400">Tagihan</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>📷 {stats.scanCount} Scan</span>
                <span>•</span>
                <span>✍️ {stats.manualCount} Manual</span>
              </div>
            </div>

            {/* Total Peserta */}
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Peserta</span>
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-black text-white">
                {stats.totalParticipants}{" "}
                <span className="text-xs font-normal text-slate-400">Orang</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Terlibat dalam pembagian tagihan
              </div>
            </div>

            {/* Status Pelunasan */}
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Status Pelunasan</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-black text-emerald-400">
                {stats.fullyPaidCount}{" "}
                <span className="text-xs font-normal text-slate-400">Lunas</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="text-amber-400">{stats.partialPaidCount} Sebagian</span>
                <span>•</span>
                <span className="text-rose-400">{stats.pendingCount} Belum</span>
              </div>
            </div>
          </div>
        )}

        {/* 🔍 FILTERS & CONTROLS */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3.5">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama resto, judul acara, menu, atau peserta..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 min-touch-target"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-semibold text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="highest">Nominal Terbesar</option>
              </select>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Status:</span>
            {[
              { id: "all", label: "Semua" },
              { id: "paid", label: "Lunas Penuh" },
              { id: "partial", label: "Sebagian Lunas" },
              { id: "pending", label: "Belum Bayar" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === st.id
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {st.label}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

            <span className="text-[11px] text-slate-400 font-semibold mr-1">Sumber:</span>
            {[
              { id: "all", label: "Semua" },
              { id: "scan", label: "📷 Scan Struk" },
              { id: "manual", label: "✍️ Manual" },
            ].map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSourceFilter(sc.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  sourceFilter === sc.id
                    ? "bg-slate-700 text-white shadow-xs"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* 📋 TRANSACTIONS LIST / TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Daftar Transaksi</h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-mono">
                {filteredTransactions.length}
              </span>
            </div>
            <span className="text-xs text-slate-500">Klik baris untuk rincian detail</span>
          </div>

          {isLoadingData ? (
            <div className="p-16 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent mx-auto" />
              <p className="text-xs text-slate-400 mt-3 font-medium">Memuat data transaksi terbaru...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Receipt className="w-10 h-10 text-slate-700 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Tidak ada transaksi ditemukan</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== "all" || sourceFilter !== "all"
                  ? "Coba sesuaikan kata kunci pencarian atau filter status yang dipilih."
                  : "Belum ada transaksi tagihan yang tercatat di server."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 sm:p-5 hover:bg-slate-800/60 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-sky-400 transition truncate">
                        {tx.title}
                      </h3>

                      {/* Source Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] font-medium border border-slate-700/80">
                        {tx.source === "scan" ? (
                          <>
                            <Camera className="w-3 h-3 text-sky-400" />
                            <span>Scan Struk</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>Manual</span>
                          </>
                        )}
                      </span>

                      {/* Status Badge */}
                      {tx.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Lunas</span>
                        </span>
                      ) : tx.status === "partial" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          <span>Sebagian ({tx.paidCount}/{tx.participantCount})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          <span>Belum Bayar</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{tx.date}</span>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{tx.participantCount} Peserta</span>
                      </span>
                      <span>&bull;</span>
                      <span>{tx.itemCount} Menu</span>
                      <span>&bull;</span>
                      <span className="font-mono text-[11px] text-slate-500 truncate max-w-[120px]">
                        ID: {tx.id}
                      </span>
                    </div>
                  </div>

                  {/* Right: Nominal & Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-left sm:text-right">
                      <div className="text-base sm:text-lg font-black text-white">
                        {formatCurrency(tx.grandTotal, tx.currency)}
                      </div>
                      <div className="text-[11px] text-slate-400">
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
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
                      >
                        Detail
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetId(tx.id);
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
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
      {/* 3. TRANSACTION DETAIL MODAL */}
      {/* ===================================================================== */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[90dvh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Rincian Transaksi Tagihan</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedTx.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition min-touch-target flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {/* Grand Total Hero Banner */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Grand Total Tagihan</span>
                  <div className="text-2xl font-black text-white mt-0.5">
                    {formatCurrency(selectedTx.grandTotal, selectedTx.currency)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {selectedTx.title} &bull; {selectedTx.date}
                  </div>
                </div>

                <div className="text-right">
                  {selectedTx.status === "paid" ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Semua Lunas</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{selectedTx.paidCount}/{selectedTx.participantCount} Lunas</span>
                    </span>
                  )}
                  <div className="text-[11px] text-slate-400 mt-1.5">
                    Sumber: {selectedTx.source === "scan" ? "📷 Scan Struk" : "✍️ Input Manual"}
                  </div>
                </div>
              </div>

              {/* Receipt Image if available */}
              {selectedTx.receiptImageUrl && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Foto Struk Asli
                  </h4>
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center max-h-60 overflow-hidden">
                    <img
                      src={selectedTx.receiptImageUrl}
                      alt="Foto Struk"
                      className="max-h-56 object-contain rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Breakdown Menu Items */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Daftar Menu ({selectedTx.items.length})
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    Subtotal: {formatCurrency(selectedTx.subtotal, selectedTx.currency)}
                  </span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
                  {selectedTx.items.map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-200">{it.name}</div>
                        <div className="text-slate-500 text-[11px]">
                          {it.quantity}x @ {formatCurrency(it.unitPrice, selectedTx.currency)}
                        </div>
                      </div>
                      <div className="font-bold text-white">
                        {formatCurrency(it.totalPrice, selectedTx.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charges summary */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Pajak (Tax):</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(selectedTx.tax, selectedTx.currency)}
                  </span>
                </div>
                {selectedTx.service > 0 && (
                  <div className="flex justify-between">
                    <span>Biaya Layanan (Service):</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(selectedTx.service, selectedTx.currency)}
                    </span>
                  </div>
                )}
                {selectedTx.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Diskon:</span>
                    <span className="font-semibold">
                      -{formatCurrency(selectedTx.discount, selectedTx.currency)}
                    </span>
                  </div>
                )}
              </div>

              {/* Participants Breakdown & Payment Status */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Rincian Pembagian Per Orang ({selectedTx.participants.length})
                </h4>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl divide-y divide-slate-800">
                  {selectedTx.participants.map((p, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{p.name}</span>
                        {p.paymentStatus === "paid" ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold">
                            ✓ Lunas
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md text-[10px] font-bold">
                            ⏳ Belum Bayar
                          </span>
                        )}
                      </div>
                      <div className="font-black text-white text-sm">
                        {formatCurrency(p.amount, selectedTx.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
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
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full p-6 rounded-3xl space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-white text-base">Hapus Transaksi Ini?</h3>
              <p className="text-xs text-slate-400">
                Data transaksi ID <span className="font-mono text-slate-300">{deleteTargetId}</span> akan dihapus dari daftar arsip admin.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition min-touch-target"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTransaction(deleteTargetId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition min-touch-target"
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
