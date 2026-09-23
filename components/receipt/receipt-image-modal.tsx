"use client";

import React, { useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon } from "lucide-react";

interface ReceiptImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export function ReceiptImageModal({
  isOpen,
  onClose,
  imageUrl,
}: ReceiptImageModalProps) {
  const [scale, setScale] = useState(1);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const zoomIn = () => setScale((s) => Math.min(3, s + 0.25));
  const zoomOut = () => setScale((s) => Math.max(0.75, s - 0.25));
  const resetZoom = () => setScale(1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-6 animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-slate-700/80 text-xs font-semibold backdrop-blur-xs">
          <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
          <span>Foto Struk Asli</span>
          <span className="text-slate-400">• {Math.round(scale * 100)}%</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-full border border-slate-700/80 backdrop-blur-xs">
          <button
            type="button"
            onClick={zoomOut}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-90"
            title="Perkecil"
            aria-label="Perkecil foto"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-90"
            title="Reset Ukuran"
            aria-label="Reset ukuran"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={zoomIn}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-90"
            title="Perbesar"
            aria-label="Perbesar foto"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1" />
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white transition active:scale-90"
            title="Tutup"
            aria-label="Tutup preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable / Zoomable Container */}
      <div
        className="w-full h-full overflow-auto flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="transition-transform duration-200 ease-out origin-center"
          style={{ transform: `scale(${scale})` }}
        >
          <img
            src={imageUrl}
            alt="Detail Foto Struk"
            className="max-h-[85vh] max-w-[95vw] object-contain rounded-xl shadow-2xl select-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-400 text-xs bg-slate-900/70 px-4 py-1.5 rounded-full border border-slate-700/50 pointer-events-none">
        Gunakan tombol zoom untuk memeriksa angka struk dengan jelas
      </div>
    </div>
  );
}
