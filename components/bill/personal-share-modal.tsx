"use client";

import React, { useState } from "react";
import {
  BillData,
  HostPaymentProfile,
  ParticipantCalculation,
} from "@/lib/types/bill";
import {
  generatePersonalWhatsAppMessage,
  buildWhatsAppUrl,
  formatWhatsAppPhone,
} from "@/lib/sharing/share-utils";
import { formatCurrency } from "@/lib/utils";
import {
  X,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Phone,
  Sparkles,
} from "lucide-react";

interface PersonalShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: BillData;
  participant: ParticipantCalculation | null;
  profile: HostPaymentProfile | null;
}

export function PersonalShareModal({
  isOpen,
  onClose,
  bill,
  participant,
  profile,
}: PersonalShareModalProps) {
  const [phone, setPhone] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !participant) return null;

  const message = generatePersonalWhatsAppMessage(bill, participant, profile);
  const waUrl = buildWhatsAppUrl(phone, message);

  const handleCopy = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    window.open(waUrl, "_blank", "noopener,noreferrer");
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
      <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4 my-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Kirim WA ke {participant.name}
              </h3>
              <p className="text-xs text-slate-500">
                Total:{" "}
                <span className="font-bold text-slate-800">
                  {formatCurrency(participant.finalTotal, bill.currency)}
                </span>
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

        {/* Optional Phone Number */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Nomor WhatsApp {participant.name} (Opsional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812xxxxxxx"
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Jika dikosongkan, WhatsApp akan meminta Anda memilih kontak tujuan.
          </p>
        </div>

        {/* Message Preview Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Pratinjau Pesan Personal</span>
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Pesan</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl max-h-48 overflow-y-auto text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
            {message}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCopy}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition active:scale-98 min-touch-target"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Salin Teks Saja</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-98 min-touch-target"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Buka WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>
    </div>
  );
}
