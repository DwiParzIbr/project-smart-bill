"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Participant } from "@/lib/types/bill";
import { UserPlus, X, User, Sparkles, Users, History, ChevronDown, ChevronUp } from "lucide-react";
import { AlertDialog } from "@/components/ui/modal";
import { getPastParticipants, PastParticipant } from "@/lib/storage/bill-storage";

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
  const [pastParticipants, setPastParticipants] = useState<PastParticipant[]>([]);
  const [showAllPast, setShowAllPast] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    getPastParticipants().then((list) => {
      setPastParticipants(list);
    });
  }, []);

  // Filter past participants who are not yet added to current bill
  const availablePastParticipants = useMemo(() => {
    return pastParticipants.filter(
      (past) =>
        !participants.some(
          (active) => active.name.trim().toLowerCase() === past.name.trim().toLowerCase()
        )
    );
  }, [pastParticipants, participants]);

  // Autocomplete matching items when typing
  const matchingSuggestions = useMemo(() => {
    const q = nameInput.trim().toLowerCase();
    if (!q) return [];
    return availablePastParticipants.filter((past) =>
      past.name.toLowerCase().includes(q)
    );
  }, [nameInput, availablePastParticipants]);

  const addParticipant = (nameToAdd?: string) => {
    const finalName = (nameToAdd || nameInput).trim();
    if (!finalName) return;

    // Avoid duplicate names in the same bill
    const isDuplicate = participants.some(
      (p) => p.name.trim().toLowerCase() === finalName.toLowerCase()
    );
    if (isDuplicate) {
      setNameInput("");
      return;
    }

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
      if (matchingSuggestions.length > 0 && matchingSuggestions[0].name.toLowerCase() === nameInput.trim().toLowerCase()) {
        addParticipant(matchingSuggestions[0].name);
      } else {
        addParticipant();
      }
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

      {/* Input box & Autocomplete */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik nama peserta..."
              autoComplete="off"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none min-touch-target text-base shadow-2xs"
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

        {/* Autocomplete dropdown suggestion */}
        {isInputFocused && matchingSuggestions.length > 0 && (
          <div className="absolute left-0 right-16 top-full mt-1.5 z-20 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1">
            <div className="p-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-500" />
              <span>Saran dari Transaksi Lampau</span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {matchingSuggestions.slice(0, 5).map((match) => (
                <button
                  key={match.name}
                  type="button"
                  onMouseDown={() => addParticipant(match.name)}
                  className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-sky-50 text-slate-800 transition text-sm font-medium"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center">
                      {match.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{match.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {match.usageCount}x ikut
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick-Pick Chips: Pernah Ikut Sebelumnya */}
      {availablePastParticipants.length > 0 && (
        <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <History className="w-4 h-4 text-sky-600" />
              <span>Pernah Ikut Sebelumnya</span>
              <span className="text-[10px] text-slate-400 font-normal">
                (Klik untuk tambah)
              </span>
            </div>
            {availablePastParticipants.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllPast(!showAllPast)}
                className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-0.5"
              >
                <span>{showAllPast ? "Ringkas" : `Semua (${availablePastParticipants.length})`}</span>
                {showAllPast ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(showAllPast ? availablePastParticipants : availablePastParticipants.slice(0, 8)).map(
              (past) => (
                <button
                  key={past.name}
                  type="button"
                  onClick={() => addParticipant(past.name)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-sky-50 border border-slate-200/80 hover:border-sky-300 rounded-xl text-xs font-semibold text-slate-700 hover:text-sky-800 transition active:scale-95 shadow-2xs group min-touch-target"
                >
                  <span className="w-5 h-5 rounded-lg bg-white border border-slate-200 text-sky-700 font-bold text-[10px] flex items-center justify-center group-hover:border-sky-300">
                    {past.name.charAt(0).toUpperCase()}
                  </span>
                  <span>{past.name}</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-sky-600 font-normal">
                    +{past.usageCount}x
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      )}

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
