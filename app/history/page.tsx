"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAllBills,
  deleteBill,
  StoredBillRecord,
} from "@/lib/storage/bill-storage";
import { formatCurrency } from "@/lib/utils";
import {
  Receipt,
  Search,
  Trash2,
  ChevronRight,
  Clock,
  CheckCircle2,
  Calendar,
  Plus,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/modal";

export default function HistoryPage() {
  const router = useRouter();
  const [bills, setBills] = useState<StoredBillRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [loading, setLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadData = async () => {
    const list = await getAllBills();
    setBills(list);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      await deleteBill(deleteTargetId);
      setDeleteTargetId(null);
      await loadData();
    }
  };

  const filteredBills = bills.filter((rec) => {
    const matchesSearch = rec.bill.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const allPaid = rec.result.participants.every(
      (p) => p.paymentStatus === "paid"
    );

    if (filter === "completed") return matchesSearch && allPaid;
    if (filter === "pending") return matchesSearch && !allPaid;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-28 pt-4">
      <main className="max-w-xl mx-auto px-4 space-y-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Riwayat Tagihan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftar tagihan makan bersama yang telah Anda hitung.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama acara atau restoran..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none min-touch-target shadow-2xs"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 p-1 bg-slate-200/60 rounded-xl">
          {[
            { id: "all", label: "Semua" },
            { id: "pending", label: "Ada yg Belum Bayar" },
            { id: "completed", label: "Semua Lunas" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition min-touch-target ${
                filter === tab.id
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bill List */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="p-10 text-center bg-white border border-dashed border-slate-200 rounded-3xl space-y-3">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Belum ada riwayat tagihan
            </p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Buat tagihan baru dengan memotret struk atau memasukkan menu secara manual.
            </p>
            <button
              onClick={() => router.push("/create")}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Tagihan Pertama</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBills.map((rec) => {
              const allPaid = rec.result.participants.every(
                (p) => p.paymentStatus === "paid"
              );
              const paidCount = rec.result.participants.filter(
                (p) => p.paymentStatus === "paid"
              ).length;

              return (
                <div
                  key={rec.id}
                  onClick={() => router.push(`/bill/${rec.id}/result`)}
                  className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs hover:border-sky-300 hover:shadow-sm transition cursor-pointer flex items-center justify-between gap-3 group min-touch-target"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 text-base truncate">
                        {rec.bill.title}
                      </h3>
                      {allPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Lunas</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>
                            {paidCount}/{rec.result.participants.length}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {rec.bill.date}
                      </span>
                      <span>•</span>
                      <span>{rec.result.participants.length} Orang</span>
                      <span>•</span>
                      <span>{rec.bill.items.length} Menu</span>
                    </div>

                    <div className="mt-2 text-base font-black text-slate-900">
                      {formatCurrency(
                        rec.result.finalGrandTotal,
                        rec.bill.currency
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, rec.id)}
                      className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition min-touch-target flex items-center justify-center"
                      aria-label="Hapus tagihan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-slate-300 group-hover:text-sky-600 transition">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modern Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Hapus Catatan Tagihan?"
        description="Riwayat tagihan ini beserta data perhitungan dan status pembayarannya akan dihapus secara permanen dari perangkat Anda."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
