"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Upload,
  Sparkles,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Key,
  AlertTriangle,
  RotateCcw,
  Edit3,
  ExternalLink,
  Check,
  X,
  Maximize2,
} from "lucide-react";
import { ParsedReceiptData } from "@/lib/ocr/receipt-parser";
import { performReceiptOCR } from "@/lib/ocr/client-ocr";
import { OCRReviewTable } from "@/components/receipt/ocr-review-table";
import { ReceiptImageModal } from "@/components/receipt/receipt-image-modal";
import { ImageCropModal } from "@/components/receipt/image-crop-modal";
import { BillData, BillItem } from "@/lib/types/bill";
import { createDefaultBill } from "@/lib/storage/default-bill";
import { saveDraft } from "@/lib/storage/bill-storage";

export default function ScanReceiptPage() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState("Memproses struk...");
  const [parsedData, setParsedData] = useState<ParsedReceiptData | null>(null);
  const [geminiKey, setGeminiKey] = useState<string>("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState("");
  const [showImageDetail, setShowImageDetail] = useState(false);

  // Crop & rotate state
  const [rawFileToCrop, setRawFileToCrop] = useState<File | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("smart_bill_gemini_key") || "";
      setGeminiKey(savedKey);
      setTempKey(savedKey);
    }
  }, []);

  const handleSaveKey = () => {
    const trimmed = tempKey.trim();
    setGeminiKey(trimmed);
    if (typeof window !== "undefined") {
      localStorage.setItem("smart_bill_gemini_key", trimmed);
    }
    setShowKeyModal(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRawFileToCrop(file);
      setShowCropModal(true);
      // Reset input value so user can pick the same file again if desired
      e.target.value = "";
    }
  };

  const handleCropConfirm = (croppedFile: File) => {
    setShowCropModal(false);
    setSelectedFile(croppedFile);
    const url = URL.createObjectURL(croppedFile);
    setSelectedImage(url);
    runOCR(croppedFile);
  };

  const runOCR = async (file: File) => {
    setIsProcessing(true);
    setProgressText("Mempersiapkan gambar...");

    try {
      const result = await performReceiptOCR(
        file,
        geminiKey || null,
        (msg) => setProgressText(msg)
      );

      setParsedData(result);
    } catch (err: any) {
      console.error("Scan error:", err);
      setParsedData({
        items: [],
        subtotal: 0,
        tax: 0,
        service: 0,
        discount: 0,
        total: 0,
        isTotalMatching: false,
        discrepancy: 0,
        isReceipt: false,
        error: "Gagal memproses gambar. Pastikan format foto didukung (JPG, PNG, WebP).",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryWithFile = () => {
    if (selectedFile) {
      runOCR(selectedFile);
    } else {
      setParsedData(null);
      setSelectedImage(null);
    }
  };

  const handleConfirmReceipt = async (confirmed: ParsedReceiptData) => {
    const draft: BillData = createDefaultBill();
    draft.title = confirmed.storeName || "Struk Restoran";

    const convertedItems: BillItem[] = confirmed.items.map((it, idx) => ({
      id: `item_ocr_${Date.now()}_${idx}`,
      name: it.name,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: it.totalPrice,
      assignments: draft.participants.map((p) => ({
        id: `asg_${p.id}_${idx}`,
        participantId: p.id,
        shareType: "equal",
        shareValue: 1,
      })),
    }));

    draft.items = convertedItems;

    // Set tax and service charges if detected
    if (confirmed.tax > 0 && confirmed.subtotal > 0) {
      draft.charges.taxRate = Math.round(
        (confirmed.tax / confirmed.subtotal) * 100
      );
    }
    if (confirmed.service > 0 && confirmed.subtotal > 0) {
      draft.charges.serviceRate = Math.round(
        (confirmed.service / confirmed.subtotal) * 100
      );
    }
    if (confirmed.discount > 0) {
      draft.charges.discountType = "fixed";
      draft.charges.discountValue = confirmed.discount;
    }

    if (selectedImage) {
      draft.receiptImageUrl = selectedImage;
    }

    await saveDraft(draft);
    router.push("/create");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 pt-4">
      <main className="max-w-xl mx-auto px-4 space-y-5">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 min-touch-target"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          <button
            onClick={() => setShowKeyModal(true)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition min-touch-target ${
              geminiKey
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{geminiKey ? "AI Vision Aktif" : "Atur AI Vision"}</span>
          </button>
        </div>

        {/* Modal Pengaturan API Key */}
        {showKeyModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowKeyModal(false);
            }}
          >
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold border border-sky-100">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Google Gemini AI Vision
                    </h3>
                    <p className="text-[11px] text-sky-600 font-semibold">Gemini 3.6 & 3.8 Flash</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Mendukung model terbaru <strong>Google Gemini 3.6 Flash</strong>, <strong>3.8 Flash</strong>, dan <strong>3.5 Flash Lite</strong> untuk deteksi struk kasir paling akurat dan secepat kilat.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-2xl text-xs text-sky-900 flex items-center justify-between">
                <span>Belum punya API key? Gratis di Google AI Studio.</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-sky-700 hover:underline flex items-center gap-1 shrink-0 ml-2"
                >
                  <span>Daftar</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTempKey("");
                    setGeminiKey("");
                    localStorage.removeItem("smart_bill_gemini_key");
                    setShowKeyModal(false);
                  }}
                  className="px-4 py-3 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition min-touch-target"
                >
                  Hapus Key
                </button>
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md active:scale-98 transition min-touch-target"
                >
                  Simpan & Gunakan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* If review table is ready and is a valid receipt */}
        {parsedData && parsedData.isReceipt && parsedData.items.length > 0 ? (
          <div className="space-y-4">
            {selectedImage && (
              <div
                onClick={() => setShowImageDetail(true)}
                className="relative h-44 w-full rounded-3xl overflow-hidden border border-slate-200 shadow-xs bg-slate-900 group cursor-pointer"
                title="Klik untuk melihat foto struk secara detail"
              >
                <img
                  src={selectedImage}
                  alt="Receipt Preview"
                  className="w-full h-full object-contain group-hover:scale-102 transition duration-300"
                />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 text-white text-xs font-semibold backdrop-blur-xs">
                    <Maximize2 className="w-3.5 h-3.5" />
                    Klik untuk Perbesar Struk
                  </span>
                </div>
                <div className="absolute bottom-2 right-2 sm:hidden">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-medium backdrop-blur-xs">
                    <Maximize2 className="w-3 h-3" />
                    Perbesar Struk
                  </span>
                </div>
              </div>
            )}
            <OCRReviewTable
              data={parsedData}
              onConfirm={handleConfirmReceipt}
              onCancel={() => {
                setParsedData(null);
                setSelectedImage(null);
                setSelectedFile(null);
              }}
            />
          </div>
        ) : parsedData && (!parsedData.isReceipt || parsedData.items.length === 0) ? (
          /* Detection Failed / Not a Receipt State */
          <div className="space-y-4">
            {selectedImage && (
              <div
                onClick={() => setShowImageDetail(true)}
                className="relative h-48 w-full rounded-3xl overflow-hidden border border-slate-200 shadow-xs bg-slate-900 cursor-pointer group"
                title="Klik untuk melihat foto lebih jelas"
              >
                <img
                  src={selectedImage}
                  alt="Preview Foto"
                  className="w-full h-full object-contain opacity-75 group-hover:opacity-95 transition"
                />
                <div className="absolute bottom-2 right-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-xs">
                    <Maximize2 className="w-3 h-3" />
                    Perbesar Foto
                  </span>
                </div>
              </div>
            )}

            <div className="p-6 bg-white border border-rose-200 rounded-3xl text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Foto Tidak Terdeteksi Sebagai Struk
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  {parsedData.error ||
                    "Tidak ditemukan nama menu makanan atau angka harga pada foto ini. Pastikan foto memperlihatkan struk kasir/restoran dengan jelas."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setParsedData(null);
                    setSelectedImage(null);
                    setSelectedFile(null);
                    cameraInputRef.current?.click();
                  }}
                  className="py-3 px-4 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 min-touch-target shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>Foto Struk Ulang</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/create")}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 min-touch-target"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Input Manual Saja</span>
                </button>
              </div>

              {!geminiKey && (
                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(true)}
                    className="text-xs text-sky-700 font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>Mau deteksi lebih pintar? Aktifkan AI Gemini Vision</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Normal Upload/Capture State */
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Scan Struk Pembayaran
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Foto struk makan atau unggah dari galeri. Sistem akan membaca menu dan harga secara otomatis.
              </p>
            </div>

            {/* Hidden Inputs */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Processing State */}
            {isProcessing ? (
              <div className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm animate-in fade-in duration-200">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-100">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Sedang Membaca Struk...
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed max-w-xs mx-auto">
                    {progressText}
                  </p>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProcessing(false);
                      setSelectedImage(null);
                      setSelectedFile(null);
                    }}
                    className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition active:scale-95 min-touch-target"
                  >
                    Batalkan Pemindaian
                  </button>
                </div>
              </div>
            ) : (
              /* Capture Action Cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-6 bg-gradient-to-tr from-sky-600 to-cyan-500 text-white rounded-3xl shadow-lg shadow-sky-500/20 text-left space-y-3 transition active:scale-98 group min-touch-target"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Ambil Foto Struk</h3>
                    <p className="text-xs text-sky-100 mt-0.5">
                      Gunakan kamera ponsel untuk foto struk langsung
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 bg-white border border-slate-200 hover:border-slate-300 text-slate-900 rounded-3xl shadow-xs text-left space-y-3 transition active:scale-98 group min-touch-target"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Pilih dari Galeri</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pilih foto struk atau screenshot yang sudah ada
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* Quick Tips */}
            <div className="p-4 bg-sky-50/70 border border-sky-200/80 rounded-2xl space-y-1.5 text-xs text-slate-600">
              <span className="font-bold text-sky-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                Tips Foto Struk Jelas:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li>Pastikan cahaya cukup dan struk tidak terlipat.</li>
                <li>Posisikan seluruh nama menu dan harga dalam frame.</li>
                <li>Jika bukan struk (misal: foto orang/pemandangan), sistem akan otomatis menolak deteksi.</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Zoomable Receipt Preview Modal */}
      <ReceiptImageModal
        isOpen={showImageDetail}
        onClose={() => setShowImageDetail(false)}
        imageUrl={selectedImage}
      />

      {/* Image Crop & Rotate Modal */}
      <ImageCropModal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        file={rawFileToCrop}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}
