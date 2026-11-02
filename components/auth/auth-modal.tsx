"use client";

import React, { useState } from "react";
import { X, Mail, Lock, User, Cloud, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { syncLocalBillsToSupabase, fetchBillsFromSupabase } from "@/lib/supabase/sync";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (userEmail: string) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setNotification({ type: "error", text: "Silakan isi email dan kata sandi." });
      return;
    }

    setIsLoading(true);
    setNotification(null);

    // If Supabase is configured with real URL and Key
    if (isConfigured) {
      const supabase = createClient();
      if (!supabase) {
        setIsLoading(false);
        setNotification({ type: "error", text: "Gagal menghubungkan ke Supabase." });
        return;
      }

      if (tab === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim() || undefined,
            },
          },
        });

        setIsLoading(false);
        if (error) {
          const msg = error.message.includes("User already registered")
            ? "Email sudah terdaftar. Silakan pilih tab Masuk."
            : error.message;
          setNotification({ type: "error", text: msg });
          return;
        }

        const user = data.user;
        const session = data.session;
        if (user && session) {
          syncLocalBillsToSupabase(user.id);
        }

        if (session) {
          setNotification({
            type: "success",
            text: "Pendaftaran berhasil! Akun Anda aktif.",
          });
        } else {
          setNotification({
            type: "success",
            text: "Pendaftaran berhasil! Cek kotak masuk/spam email Anda untuk konfirmasi sebelum masuk.",
          });
        }

        setTimeout(() => {
          if (onSuccess) onSuccess(email);
          onClose();
        }, 1500);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        setIsLoading(false);
        if (error) {
          const msg = error.message.includes("Email not confirmed")
            ? "Email belum dikonfirmasi. Periksa kotak masuk/spam email Anda untuk verifikasi."
            : error.message.includes("Invalid login credentials")
            ? "Email atau kata sandi salah. Silakan periksa kembali."
            : error.message;
          setNotification({ type: "error", text: msg });
          return;
        }

        const user = data.user;
        if (user) {
          // Sync existing local bills to cloud and pull remote bills
          syncLocalBillsToSupabase(user.id);
          fetchBillsFromSupabase(user.id);
        }

        setNotification({
          type: "success",
          text: "Berhasil masuk ke Akun Cloud!",
        });

        setTimeout(() => {
          if (onSuccess) onSuccess(email);
          onClose();
        }, 1000);
      }
      return;
    }

    // Fallback simulation mode if Supabase env vars not yet added
    setTimeout(() => {
      setIsLoading(false);
      setNotification({
        type: "success",
        text: tab === "login" ? "Berhasil masuk ke Cloud Akun!" : "Akun berhasil didaftarkan!",
      });

      setTimeout(() => {
        if (onSuccess) onSuccess(email);
        onClose();
      }, 1000);
    }, 700);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setNotification(null);

    if (isConfigured) {
      const supabase = createClient();
      if (supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });
        if (error) {
          setIsLoading(false);
          setNotification({ type: "error", text: error.message });
          return;
        }
        return;
      }
    }

    // Fallback simulation
    setTimeout(() => {
      setIsLoading(false);
      setNotification({
        type: "success",
        text: "Berhasil terhubung dengan Google!",
      });
      setTimeout(() => {
        if (onSuccess) onSuccess("user@google.com");
        onClose();
      }, 1000);
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-slate-900 text-base">Akun Smart Bill Cloud</h2>
                {isConfigured && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                    Supabase Live
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Cadangkan tagihan & sinkronkan antar-perangkat</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setNotification(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              tab === "login" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setNotification(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              tab === "register" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Daftar Akun Baru
          </button>
        </div>

        {notification && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in ${
              notification.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span className="font-medium">{notification.text}</span>
          </div>
        )}

        {/* 1-Click Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-white hover:bg-slate-50 active:scale-98 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 transition flex items-center justify-center gap-2.5 shadow-2xs min-touch-target"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Lanjutkan dengan Google</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">atau dengan email</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === "register" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 active:scale-98 font-bold text-white rounded-xl text-xs shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-1.5 min-touch-target"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{tab === "login" ? "Masuk ke Akun" : "Daftar Akun Cloud"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Guest Mode Assurance */}
        <div className="pt-2 border-t border-slate-100 text-center space-y-1">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition"
          >
            Lanjut Tanpa Login (Tetap Mode Tamu)
          </button>
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Data tagihan lokal Anda tetap tersimpan aman di perangkat</span>
          </p>
        </div>
      </div>
    </div>
  );
}
