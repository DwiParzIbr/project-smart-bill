"use client";

import React from "react";
import { X, QrCode, Download } from "lucide-react";

interface QRISPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrisImageUrl: string | null | undefined;
  hostName?: string;
}

export function QRISPreviewModal({
  isOpen,
  onClose,
  qrisImageUrl,
  hostName,
}: QRISPreviewModalProps) {
  if (!isOpen || !qrisImageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = qrisImageUrl;
    a.download = `QRIS_${(hostName || "Pembayaran").replace(/\s+/g, "_")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200 text-center">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-left">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">QRIS Pembayaran</h3>
              <p className="text-xs text-slate-500">{hostName || "Penagih"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition min-touch-target"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrisImageUrl}
            alt="QRIS Pembayaran"
            className="max-h-72 w-auto object-contain rounded-xl shadow-xs"
          />
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Pindai QRIS ini menggunakan aplikasi m-Banking (BCA, Mandiri, BRI, dll) atau e-Wallet (GoPay, DANA, OVO).
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleDownload}
            className="py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition min-touch-target"
          >
            <Download className="w-4 h-4" />
            <span>Simpan QRIS</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition min-touch-target"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
