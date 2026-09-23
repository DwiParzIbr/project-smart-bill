"use client";

import React, { useState } from "react";
import {
  X,
  Share,
  PlusSquare,
  Download,
  Smartphone,
  CheckCircle2,
  Sparkles,
  Laptop,
  MoreVertical,
  Layers,
  ArrowRight,
} from "lucide-react";

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  canInstall: boolean;
  onInstall: () => Promise<void>;
  isIOS: boolean;
  isAndroid: boolean;
}

export function PWAInstallModal({
  isOpen,
  onClose,
  canInstall,
  onInstall,
  isIOS,
  isAndroid,
}: PWAInstallModalProps) {
  // Determine default tab based on detected platform
  const [activeTab, setActiveTab] = useState<"ios" | "android" | "desktop">(() => {
    if (isIOS) return "ios";
    if (isAndroid) return "android";
    return "android"; // default to mobile first
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-5 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-b from-sky-50/70 to-white">
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 shadow-md shadow-sky-500/20 flex items-center justify-center text-white shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 text-base">Pasang Smart Bill</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                  PWA
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Jadikan aplikasi HP mandiri, bebas dari tab browser
              </p>
            </div>
          </div>

          {/* Keuntungan ringkas */}
          <div className="mt-3.5 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="bg-white/80 border border-slate-200/80 rounded-xl p-1.5 shadow-2xs">
              <span className="font-semibold text-slate-800 block">📱 Fullscreen</span>
              <span className="text-slate-500 text-[10px]">Tanpa URL bar</span>
            </div>
            <div className="bg-white/80 border border-slate-200/80 rounded-xl p-1.5 shadow-2xs">
              <span className="font-semibold text-slate-800 block">⚡ Cepat</span>
              <span className="text-slate-500 text-[10px]">Buka seketika</span>
            </div>
            <div className="bg-white/80 border border-slate-200/80 rounded-xl p-1.5 shadow-2xs">
              <span className="font-semibold text-slate-800 block">📴 Offline</span>
              <span className="text-slate-500 text-[10px]">Hemat kuota</span>
            </div>
          </div>
        </div>

        {/* Device Switcher Tabs */}
        <div className="flex p-2 bg-slate-100/90 gap-1 text-xs font-semibold border-b border-slate-200">
          <button
            onClick={() => setActiveTab("ios")}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === "ios"
                ? "bg-white text-sky-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🍎 iPhone / iPad</span>
          </button>
          <button
            onClick={() => setActiveTab("android")}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === "android"
                ? "bg-white text-sky-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🤖 Android</span>
          </button>
          <button
            onClick={() => setActiveTab("desktop")}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === "desktop"
                ? "bg-white text-sky-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PC</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700">
          {/* TAB IPHONE / IOS */}
          {activeTab === "ios" && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-900">
                <p className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Wajib menggunakan peramban <strong>Safari</strong> di iPhone
                </p>
                <p className="text-[11px] text-amber-800 mt-1">
                  Apple mewajibkan pemasangan aplikasi layar utama melalui peramban resmi Safari.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Ketuk Tombol Bagikan (Share)</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lihat bilah bawah peramban Safari dan tekan tombol{" "}
                      <span className="inline-flex items-center gap-1 font-semibold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                        <Share className="w-3 h-3" /> Bagikan
                      </span>
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      Pilih &ldquo;Tambah ke Layar Utama&rdquo;
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gulir ke bawah pada menu Safari lalu ketuk opsi{" "}
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded">
                        <PlusSquare className="w-3 h-3 text-sky-600" /> Tambah ke Layar Utama
                      </span>
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Ketuk &ldquo;Tambah&rdquo; (Add)</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tekan tulisan <strong>Tambah</strong> di sudut kanan atas layar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Selesai! Buka Smart Bill dari Home Screen iPhone Anda untuk tampilan fullscreen tanpa address bar.
                </span>
              </div>
            </div>
          )}

          {/* TAB ANDROID */}
          {activeTab === "android" && (
            <div className="space-y-3">
              {/* If browser supports 1-click install */}
              {canInstall && (
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                    <p className="font-semibold text-sky-950 text-xs sm:text-sm">
                      Perangkat Anda Mendukung Pasang 1-Sentuhan!
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await onInstall();
                      onClose();
                    }}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-semibold rounded-xl shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Pasang Aplikasi Sekarang</span>
                  </button>
                </div>
              )}

              {/* Step by step manual guide */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-600">
                  {canInstall
                    ? "Atau pasang manual melalui menu Chrome:"
                    : "Cara Pasang di Google Chrome / Browser Android:"}
                </p>

                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Ketuk Menu Titik Tiga (⋮)</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lihat pojok kanan atas peramban Chrome dan tekan menu{" "}
                      <span className="inline-flex items-center font-bold text-slate-800 bg-slate-200 px-1.5 py-0.2 rounded">
                        <MoreVertical className="w-3 h-3" /> Titik Tiga
                      </span>
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      Pilih &ldquo;Pasang Aplikasi&rdquo; / &ldquo;Tambahkan ke Layar Utama&rdquo;
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cari dan ketuk menu <strong>&ldquo;Pasang aplikasi&rdquo;</strong> (atau <em>Add to Home Screen</em>).
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Konfirmasi Pasang</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ketuk <strong>&ldquo;Install&rdquo;</strong> pada dialog konfirmasi.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Smart Bill otomatis terpasang di launcher HP Android Anda dan dapat dibuka tanpa koneksi web browser.
                </span>
              </div>
            </div>
          )}

          {/* TAB DESKTOP / PC */}
          {activeTab === "desktop" && (
            <div className="space-y-3">
              {canInstall && (
                <button
                  onClick={async () => {
                    await onInstall();
                    onClose();
                  }}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-semibold rounded-xl shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Pasang di Komputer Sekarang</span>
                </button>
              )}

              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                  <p className="font-semibold text-slate-900">Melalui Address Bar Chrome / Edge:</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Perhatikan bilah alamat (URL bar) di bagian atas kanan. Klik ikon{" "}
                    <strong>Install Smart Bill</strong> <Download className="w-3.5 h-3.5 inline text-sky-600" /> lalu klik <strong>Pasang</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl transition"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
