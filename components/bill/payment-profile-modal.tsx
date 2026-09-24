"use client";

import React, { useState, useRef } from "react";
import { HostPaymentProfile, PaymentAccount } from "@/lib/types/bill";
import {
  X,
  CreditCard,
  Plus,
  Trash2,
  QrCode,
  Upload,
  Check,
  Building,
  Smartphone,
  Info,
} from "lucide-react";

interface PaymentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile: HostPaymentProfile | null;
  onSave: (profile: HostPaymentProfile) => void;
}

const POPULAR_PROVIDERS = [
  { name: "BCA", type: "bank" },
  { name: "Mandiri", type: "bank" },
  { name: "BRI", type: "bank" },
  { name: "BNI", type: "bank" },
  { name: "Bank Jago", type: "bank" },
  { name: "SeaBank", type: "bank" },
  { name: "GoPay", type: "ewallet" },
  { name: "DANA", type: "ewallet" },
  { name: "OVO", type: "ewallet" },
  { name: "ShopeePay", type: "ewallet" },
];

export function PaymentProfileModal({
  isOpen,
  onClose,
  initialProfile,
  onSave,
}: PaymentProfileModalProps) {
  const [hostName, setHostName] = useState(initialProfile?.hostName || "");
  const [accounts, setAccounts] = useState<PaymentAccount[]>(
    initialProfile?.accounts && initialProfile.accounts.length > 0
      ? initialProfile.accounts
      : [
          {
            id: `acc_${Date.now()}`,
            provider: "BCA",
            accountNumber: "",
            accountHolder: initialProfile?.hostName || "",
          },
        ]
  );
  const [qrisImageUrl, setQrisImageUrl] = useState<string | null>(
    initialProfile?.qrisImageUrl || null
  );
  const [customNotes, setCustomNotes] = useState(
    initialProfile?.customNotes || ""
  );
  const [isProcessingImg, setIsProcessingImg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleAddAccount = () => {
    setAccounts([
      ...accounts,
      {
        id: `acc_${Date.now()}`,
        provider: "BCA",
        accountNumber: "",
        accountHolder: hostName || "",
      },
    ]);
  };

  const handleRemoveAccount = (id: string) => {
    setAccounts(accounts.filter((a) => a.id !== id));
  };

  const handleAccountChange = (
    id: string,
    field: keyof PaymentAccount,
    val: string
  ) => {
    setAccounts(
      accounts.map((a) => (a.id === id ? { ...a, [field]: val } : a))
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImg(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress to max 800px for lightweight local storage
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.82);
          setQrisImageUrl(compressed);
        }
        setIsProcessingImg(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validAccounts = accounts.filter(
      (a) => a.provider.trim() && a.accountNumber.trim()
    );

    const profile: HostPaymentProfile = {
      hostName: hostName.trim() || "Penagih",
      accounts: validAccounts,
      qrisImageUrl,
      customNotes: customNotes.trim() || undefined,
    };

    onSave(profile);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-4 my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold border border-sky-100">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Info Rekening & QRIS Penagih
              </h3>
              <p className="text-xs text-slate-500">
                Tersimpan otomatis untuk tagihan berikutnya
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition min-touch-target"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Host Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Pemilik Rekening / Penagih
            </label>
            <input
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Accounts List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pilihan Rekening Bank / e-Wallet
              </label>
              <button
                type="button"
                onClick={handleAddAccount}
                className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 min-touch-target"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Rekening</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {accounts.map((acc, index) => (
                <div
                  key={acc.id}
                  className="p-3 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">
                      Metode #{index + 1}
                    </span>
                    {accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAccount(acc.id)}
                        className="text-rose-500 hover:text-rose-700 text-xs p-1 rounded-md transition"
                        title="Hapus metode ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <select
                        value={acc.provider}
                        onChange={(e) =>
                          handleAccountChange(acc.id, "provider", e.target.value)
                        }
                        className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      >
                        {POPULAR_PROVIDERS.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={acc.accountNumber}
                        onChange={(e) =>
                          handleAccountChange(
                            acc.id,
                            "accountNumber",
                            e.target.value
                          )
                        }
                        placeholder="No Rekening / No HP e-Wallet"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={acc.accountHolder}
                      onChange={(e) =>
                        handleAccountChange(
                          acc.id,
                          "accountHolder",
                          e.target.value
                        )
                      }
                      placeholder="Atas Nama (a.n), contoh: Budi Santoso"
                      className="w-full px-3 py-1.5 bg-white/70 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QRIS Upload */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Foto Gambar QRIS (Opsional)
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {qrisImageUrl ? (
              <div className="flex items-center gap-3 p-3 bg-sky-50/70 border border-sky-200 rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrisImageUrl}
                  alt="QRIS Preview"
                  className="w-14 h-14 object-cover rounded-xl border border-sky-300"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-sky-950 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    QRIS Terpasang
                  </span>
                  <p className="text-[11px] text-sky-700 truncate">
                    Siap ditampilkan di tagihan
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-white text-sky-700 text-xs font-bold rounded-lg border border-sky-200 hover:bg-sky-50 transition"
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrisImageUrl(null)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Hapus QRIS"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImg}
                className="w-full p-4 border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl flex items-center justify-center gap-2.5 text-xs font-bold text-slate-600 hover:text-sky-700 bg-slate-50/50 hover:bg-sky-50/30 transition group min-touch-target"
              >
                <QrCode className="w-5 h-5 text-slate-400 group-hover:text-sky-600" />
                <span>
                  {isProcessingImg
                    ? "Memproses gambar..."
                    : "Unggah Foto / Screenshot QRIS"}
                </span>
              </button>
            )}
          </div>

          {/* Transfer Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Catatan Transfer (Opsional)
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Contoh: Sertakan nama kamu di berita transfer ya"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition active:scale-98 min-touch-target"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold rounded-xl text-xs shadow-md transition min-touch-target"
            >
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
