"use client";

import React, { useState } from "react";
import { Participant } from "@/lib/types/bill";
import { UserPlus, X, User } from "lucide-react";
import { AlertDialog } from "@/components/ui/modal";

interface StepParticipantsProps {
  participants: Participant[];
  onChange: (participants: Participant[]) => void;
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-teal-100 text-teal-700 border-teal-200",
];

export function StepParticipants({
  participants,
  onChange,
}: StepParticipantsProps) {
  const [nameInput, setNameInput] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const addParticipant = (nameToAdd?: string) => {
    const finalName = (nameToAdd || nameInput).trim();
    if (!finalName) return;

    const newParticipant: Participant = {
      id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: finalName,
      displayOrder: participants.length,
    };

    onChange([...participants, newParticipant]);
    setNameInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addParticipant();
    }
  };

  const removeParticipant = (id: string) => {
    if (participants.length <= 1) {
      setShowAlert(true);
      return;
    }
    onChange(participants.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Daftar Peserta
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Tambahkan siapa saja yang ikut makan dan akan membagi tagihan ini.
        </p>
      </div>

      {/* Input box */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <User className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik nama peserta..."
            autoComplete="off"
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none min-touch-target text-base"
          />
        </div>
        <button
          type="button"
          onClick={() => addParticipant()}
          className="px-5 py-3.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold rounded-2xl shadow-sm transition flex items-center gap-2 min-touch-target shrink-0"
        >
          <UserPlus className="w-5 h-5" />
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </div>

      {/* Participants List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>{participants.length} Orang Terdaftar</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {participants.map((p, idx) => {
            const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs transition group hover:border-slate-300"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border ${colorClass}`}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-900 text-base">
                    {p.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeParticipant(p.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition min-touch-target flex items-center justify-center"
                  aria-label={`Hapus ${p.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <AlertDialog
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title="Minimal 1 Peserta"
        description="Tagihan harus memiliki minimal 1 orang peserta untuk menghitung pembagian pembayaran."
        variant="warning"
      />
    </div>
  );
}
