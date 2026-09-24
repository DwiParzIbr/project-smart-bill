"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Edit3,
  Receipt,
  ArrowRight,
  Clock,
  CheckCircle2,
  Sparkles,
  Users,
  ChevronRight,
} from "lucide-react";
import { getAllBills, StoredBillRecord } from "@/lib/storage/bill-storage";
import { formatCurrency } from "@/lib/utils";

export default function HomePage() {
  const [recentBills, setRecentBills] = useState<StoredBillRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllBills().then((list) => {
      setRecentBills(list.slice(0, 3)); // show top 3 recent
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-28 pt-4">
      <main className="max-w-xl mx-auto px-4 space-y-6">
        {/* Hero greeting */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Mau bagi tagihan apa hari ini?
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hitung tagihan makan bareng secara adil, cepat, dan transparan tanpa ribet.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Scan Struk Card */}
          <Link
            href="/scan"
            className="p-5 bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-500 text-white rounded-3xl shadow-lg shadow-sky-500/25 transition active:scale-98 group min-touch-target flex flex-col justify-between h-36"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                Otomatis
              </span>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Scan Struk</h2>
              <p className="text-xs text-sky-100 mt-0.5">
                Foto struk & AI akan membaca item otomatis
              </p>
            </div>
          </Link>

          {/* Input Manual Card */}
          <Link
            href="/create"
            className="p-5 bg-white border border-slate-200 hover:border-slate-300 text-slate-900 rounded-3xl shadow-xs transition active:scale-98 group min-touch-target flex flex-col justify-between h-36"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Edit3 className="w-6 h-6 text-slate-700" />
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                Manual
              </span>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Input Manual</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ketik menu dan harga pesanan satu per satu
              </p>
            </div>
          </Link>
        </div>

        {/* Feature Highlights Card */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-3xl grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 space-y-1">
            <div className="font-bold text-slate-900">100% Adil</div>
            <div className="text-[11px] text-slate-500">Pajak proporsional</div>
          </div>
          <div className="p-2 space-y-1 border-x border-slate-100">
            <div className="font-bold text-slate-900">Zero-Drift</div>
            <div className="text-[11px] text-slate-500">Tanpa error desimal</div>
          </div>
          <div className="p-2 space-y-1">
            <div className="font-bold text-slate-900">Bisa Offline</div>
            <div className="text-[11px] text-slate-500">PWA installable</div>
          </div>
        </div>

        {/* Recent Bills Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tagihan Terakhir
            </h2>
            <Link
              href="/history"
              className="text-xs font-semibold text-sky-600 hover:underline flex items-center gap-0.5"
            >
              <span>Semua Riwayat</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-600 mx-auto"></div>
            </div>
          ) : recentBills.length === 0 ? (
            <div className="p-8 bg-white border border-dashed border-slate-200 rounded-3xl text-center space-y-2">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-medium text-slate-600">
                Belum ada riwayat tagihan.
              </p>
              <p className="text-[11px] text-slate-400">
                Mulai split bill pertama Anda dengan tombol di atas!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentBills.map((rec) => {
                const allPaid = rec.result.participants.every(
                  (p) => p.paymentStatus === "paid"
                );

                return (
                  <Link
                    key={rec.id}
                    href={`/bill/${rec.id}/result`}
                    className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-sky-300 transition flex items-center justify-between gap-3 min-touch-target"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {rec.bill.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {rec.bill.date} • {rec.result.participants.length} Orang
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-slate-900 text-sm">
                        {formatCurrency(
                          rec.result.finalGrandTotal,
                          rec.bill.currency
                        )}
                      </div>
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                          allPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {allPaid ? "Lunas" : "Belum Lunas"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
