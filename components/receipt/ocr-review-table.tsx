"use client";

import React, { useState } from "react";
import { ParsedReceiptData, ParsedReceiptItem } from "@/lib/ocr/receipt-parser";
import { formatCurrency, formatNumberInput, parseNumberInput } from "@/lib/utils";
import {
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
  Plus,
  ArrowRight,
  Receipt,
} from "lucide-react";

interface OCRReviewTableProps {
  data: ParsedReceiptData;
  onConfirm: (confirmedData: ParsedReceiptData) => void;
  onCancel: () => void;
}

export function OCRReviewTable({
  data: initialData,
  onConfirm,
  onCancel,
}: OCRReviewTableProps) {
  const [data, setData] = useState<ParsedReceiptData>(initialData);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Recalculate totals
  const itemsSubtotal = data.items.reduce((acc, it) => acc + it.totalPrice, 0);
  const expectedTotal = itemsSubtotal - data.discount + data.service + data.tax;
  const isMatching = expectedTotal === data.total;

  const handleUpdateItem = (
    id: string,
    patch: Partial<ParsedReceiptItem>
  ) => {
    const updatedItems = data.items.map((it) => {
      if (it.id === id) {
        const next = { ...it, ...patch };
        next.totalPrice = next.quantity * next.unitPrice;
        return next;
      }
      return it;
    });

    const newSubtotal = updatedItems.reduce((acc, it) => acc + it.totalPrice, 0);
    setData({
      ...data,
      items: updatedItems,
      subtotal: newSubtotal,
    });
  };

  const handleRemoveItem = (id: string) => {
    const updatedItems = data.items.filter((it) => it.id !== id);
    const newSubtotal = updatedItems.reduce((acc, it) => acc + it.totalPrice, 0);
    setData({
      ...data,
      items: updatedItems,
      subtotal: newSubtotal,
    });
  };

  const handleAddItem = () => {
    const newItem: ParsedReceiptItem = {
      id: `item_${Date.now()}`,
      name: "Menu Tambahan",
      quantity: 1,
      unitPrice: 10000,
      totalPrice: 10000,
    };
    setData({
      ...data,
      items: [...data.items, newItem],
      subtotal: data.subtotal + 10000,
    });
    setEditingItemId(newItem.id);
  };

  return (
    <div className="space-y-5 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Review Hasil Scan Struk
            </h2>
            <p className="text-xs text-slate-500">
              Periksa & koreksi nama atau harga sebelum disimpan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMatching ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Total Cocok</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Selisih {formatCurrency(Math.abs(expectedTotal - data.total))}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items list with inline editing */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Daftar Menu ({data.items.length})</span>
          <button
            type="button"
            onClick={handleAddItem}
            className="text-sky-600 hover:underline flex items-center gap-1 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Baris</span>
          </button>
        </div>

        <div className="space-y-2">
          {data.items.map((it) => {
            const isEditing = editingItemId === it.id;

            if (isEditing) {
              return (
                <div
                  key={it.id}
                  className="p-3 bg-sky-50/60 border border-sky-300 rounded-2xl space-y-2.5"
                >
                  <input
                    type="text"
                    value={it.name}
                    onChange={(e) =>
                      handleUpdateItem(it.id, { name: e.target.value })
                    }
                    placeholder="Nama menu..."
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg font-medium focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) =>
                          handleUpdateItem(it.id, {
                            quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                        className="w-14 px-2 py-1 text-center text-sm font-bold bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-xs text-slate-500">Rp:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="20.000"
                        value={it.unitPrice > 0 ? formatNumberInput(it.unitPrice) : ""}
                        onChange={(e) =>
                          handleUpdateItem(it.id, {
                            unitPrice: parseNumberInput(e.target.value),
                          })
                        }
                        className="w-full px-2.5 py-1 text-sm font-bold bg-white border border-slate-200 rounded-lg text-right"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingItemId(null)}
                      className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-sky-700"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={it.id}
                className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between group hover:border-slate-300 transition"
              >
                <div className="flex-1 pr-2">
                  <div className="font-bold text-slate-900 text-base">{it.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {it.quantity} × {formatCurrency(it.unitPrice)} ={" "}
                    <span className="font-bold text-slate-800">
                      {formatCurrency(it.totalPrice)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingItemId(it.id)}
                    className="p-2 text-slate-400 hover:text-sky-600 hover:bg-white rounded-xl transition min-touch-target flex items-center justify-center"
                    aria-label={`Edit ${it.name}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(it.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition min-touch-target flex items-center justify-center"
                    aria-label={`Hapus ${it.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charges & Grand Total breakdown */}
      <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal Item:</span>
          <span className="font-bold text-slate-900">
            {formatCurrency(itemsSubtotal)}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <span>Pajak (Tax):</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={data.tax > 0 ? formatNumberInput(data.tax) : ""}
              placeholder="0"
              onChange={(e) =>
                setData({ ...data, tax: parseNumberInput(e.target.value) })
              }
              className="w-28 px-2.5 py-1 text-right font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <span>Service Charge:</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={data.service > 0 ? formatNumberInput(data.service) : ""}
              placeholder="0"
              onChange={(e) =>
                setData({ ...data, service: parseNumberInput(e.target.value) })
              }
              className="w-28 px-2.5 py-1 text-right font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <span>Diskon Promo:</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={data.discount > 0 ? formatNumberInput(data.discount) : ""}
              placeholder="0"
              onChange={(e) =>
                setData({ ...data, discount: parseNumberInput(e.target.value) })
              }
              className="w-28 px-2.5 py-1 text-right font-bold bg-slate-50 border border-slate-200 rounded-lg text-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
          <span className="font-bold text-sm text-slate-900">Grand Total:</span>
          <span className="font-black text-xl text-sky-700">
            {formatCurrency(expectedTotal)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 min-touch-target"
        >
          Scan Ulang
        </button>
        <button
          type="button"
          onClick={() => onConfirm({ ...data, total: expectedTotal })}
          className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 min-touch-target"
        >
          <span>Gunakan Data Ini</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
