"use client";

import React, { useState, useEffect } from "react";
import { UserProfile, AVATAR_COLOR_PRESETS } from "@/lib/types/user";
import { X, User, Phone, Mail, Sparkles, Check, Smile } from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile: UserProfile | null;
  onSave: (profile: UserProfile) => void;
}

export function UserProfileModal({
  isOpen,
  onClose,
  initialProfile,
  onSave,
}: UserProfileModalProps) {
  const [name, setName] = useState(initialProfile?.name || "");
  const [phone, setPhone] = useState(initialProfile?.phone || "");
  const [email, setEmail] = useState(initialProfile?.email || "");
  const [bio, setBio] = useState(initialProfile?.bio || "");
  const [selectedColor, setSelectedColor] = useState(
    initialProfile?.avatarColor || "from-sky-600 to-cyan-500"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name || "");
      setPhone(initialProfile.phone || "");
      setEmail(initialProfile.email || "");
      setBio(initialProfile.bio || "");
      setSelectedColor(initialProfile.avatarColor || "from-sky-600 to-cyan-500");
    } else {
      setName("");
      setPhone("");
      setEmail("");
      setBio("");
      setSelectedColor("from-sky-600 to-cyan-500");
    }
    setError(null);
  }, [initialProfile, isOpen]);

  if (!isOpen) return null;

  const initials = (name.trim() || "SB")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Silakan masukkan nama Anda.");
      return;
    }

    const updatedProfile: UserProfile = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      bio: bio.trim() || undefined,
      avatarColor: selectedColor,
      createdAt: initialProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCloudSynced: initialProfile?.isCloudSynced || false,
    };

    onSave(updatedProfile);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Ubah Profil Saya</h2>
              <p className="text-[11px] text-slate-400">Atur identitas Anda di Smart Bill</p>
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

        {/* Live Avatar Preview */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-2">
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${selectedColor} text-white font-black text-2xl flex items-center justify-center shadow-md shadow-sky-500/20 transition-all`}
          >
            {initials}
          </div>
          <p className="text-xs font-bold text-slate-800">{name.trim() || "Nama Tampilan"}</p>
          <span className="text-[10px] text-slate-400 font-medium">Pratinjau Avatar</span>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Color Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Pilihan Warna Avatar</span>
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_COLOR_PRESETS.map((preset) => {
                const isSelected = selectedColor === preset.gradient;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedColor(preset.gradient)}
                    className={`h-9 rounded-xl bg-gradient-to-tr ${preset.gradient} flex items-center justify-center transition active:scale-95 relative ${
                      isSelected ? "ring-2 ring-offset-2 ring-slate-900" : "hover:opacity-90"
                    }`}
                    title={preset.label}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap / Panggilan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Contoh: Dwi Fariz"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Phone / WhatsApp */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor WhatsApp / HP <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Digunakan untuk mempermudah rekan mentransfer dan konfirmasi patungan.
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alamat Email <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Contoh: dwifariz@email.com"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Bio / Catatan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan / Motto <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Smile className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Contoh: Selalu siap patungan tepat waktu 🚀"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-98 font-bold text-slate-700 rounded-xl text-xs transition min-touch-target"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 active:scale-98 font-bold text-white rounded-xl text-xs shadow-md shadow-sky-600/20 transition min-touch-target"
            >
              Simpan Profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
