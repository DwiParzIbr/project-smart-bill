"use client";

import React, { useState, useEffect } from "react";
import { BillCalculationResult, BillData } from "@/lib/types/bill";
import {
  generateReceiptCardImage,
  ReceiptCardTheme,
} from "@/lib/sharing/receipt-card-generator";
import {
  X,
  Download,
  Share2,
  Receipt,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";

interface ReceiptCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: BillData;
  result: BillCalculationResult;
}

export function ReceiptCardModal({
  isOpen,
  onClose,
  bill,
  result,
}: ReceiptCardModalProps) {
  const [theme, setTheme] = useState<ReceiptCardTheme>("thermal");
  const [cardImage, setCardImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    generateReceiptCardImage(bill, result, theme).then((dataUrl) => {
      if (isMounted) {
        setCardImage(dataUrl);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, theme, bill, result]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!cardImage) return;
    const a = document.createElement("a");
    a.href = cardImage;
    const safeTitle = bill.title.replace(/[^a-zA-Z0-9_-]/g, "_");
    a.download = `Struk_${safeTitle}_${theme}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const handleShareImage = async () => {
    if (!cardImage) return;

    try {
      const res = await fetch(cardImage);
      const blob = await res.blob();
      const file = new File([blob], `Struk_${bill.title}.png`, {
        type: "image/png",
      });

      if (
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `Struk Tagihan: ${bill.title}`,
          text: `Rincian patungan tagihan ${bill.title} via Smart Bill Splitter.`,
        });
        return;
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
    }

    // Fallback to direct download
    handleDownload();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4 my-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Ekspor Kartu Struk Estetik
              </h3>
              <p className="text-[11px] text-slate-500">
                Cocok untuk Instagram Story & WhatsApp
              </p>
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

        {/* Theme Selector */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setTheme("thermal")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition min-touch-target ${
              theme === "thermal"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            🧾 Struk Kasir Klasik
          </button>
          <button
            type="button"
            onClick={() => setTheme("modern")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition min-touch-target ${
              theme === "modern"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            ✨ Kartu Modern
          </button>
        </div>

        {/* Live Canvas Image Preview */}
        <div className="bg-slate-900/90 rounded-2xl p-3 flex items-center justify-center min-h-72 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-slate-400 py-12">
              <Loader2 className="w-7 h-7 animate-spin text-sky-400" />
              <span className="text-xs">Menyiapkan gambar struk...</span>
            </div>
          ) : cardImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cardImage}
              alt="Pratinjau Struk"
              className="max-h-88 w-auto object-contain rounded-xl shadow-xl transition-all"
            />
          ) : (
            <span className="text-xs text-slate-400">Gagal memuat gambar.</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleDownload}
            disabled={loading || !cardImage}
            className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 min-touch-target"
          >
            {downloaded ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Tersimpan!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Unduh PNG</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleShareImage}
            disabled={loading || !cardImage}
            className="py-3 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 min-touch-target"
          >
            <Share2 className="w-4 h-4" />
            <span>Bagikan Gambar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
