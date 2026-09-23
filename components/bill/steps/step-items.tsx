"use client";

import React, { useState } from "react";
import { BillItem } from "@/lib/types/bill";
import { formatCurrency, formatNumberInput, parseNumberInput } from "@/lib/utils";
import { Plus, Trash2, Minus, Utensils } from "lucide-react";
import { AlertDialog } from "@/components/ui/modal";

interface StepItemsProps {
  items: BillItem[];
  currency: string;
  onChange: (items: BillItem[]) => void;
}

export function StepItems({ items, currency, onChange }: StepItemsProps) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState("");
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant?: "warning" | "error" | "info";
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "warning",
  });

  const addItem = () => {
    const trimmed = itemName.trim();
    const priceNum = parseNumberInput(unitPrice);

    if (!trimmed) {
      setAlertConfig({
        isOpen: true,
        title: "Nama Menu Diperlukan",
        description: "Silakan masukkan nama menu makanan atau minuman yang dipesan.",
        variant: "warning",
      });
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setAlertConfig({
        isOpen: true,
        title: "Harga Satuan Tidak Valid",
        description: "Silakan masukkan harga satuan menu lebih dari Rp 0.",
        variant: "warning",
      });
      return;
    }

    const newItem: BillItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      quantity: Math.max(1, quantity),
      unitPrice: priceNum,
      totalPrice: Math.max(1, quantity) * priceNum,
      assignments: [],
    };

    onChange([...items, newItem]);
    setItemName("");
    setQuantity(1);
    setUnitPrice("");
  };

  const updateItemQty = (id: string, newQty: number) => {
    if (newQty < 1) return;
    onChange(
      items.map((it) =>
        it.id === id
          ? { ...it, quantity: newQty, totalPrice: newQty * it.unitPrice }
          : it
      )
    );
  };

  const removeItem = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Daftar Menu & Harga
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Masukkan menu yang dipesan beserta jumlah dan harga satuannya.
        </p>
      </div>

      {/* Add Item Form Card */}
      <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
        <div>
          <label
            htmlFor="item-name"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Nama Menu
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Utensils className="w-4 h-4" />
            </div>
            <input
              id="item-name"
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Contoh: Nasi Goreng Spesial"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none min-touch-target"
            />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3 items-end">
          {/* Quantity stepper */}
          <div className="col-span-5 sm:col-span-4">
            <label
              htmlFor="item-qty"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Jumlah (Qty)
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-90 transition min-touch-target"
                aria-label="Kurangi jumlah"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                id="item-qty"
                type="number"
                inputMode="numeric"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                className="w-full text-center font-bold text-sm bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-90 transition min-touch-target"
                aria-label="Tambah jumlah"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Unit Price */}
          <div className="col-span-7 sm:col-span-5">
            <label
              htmlFor="unit-price"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Harga Satuan
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                id="unit-price"
                type="text"
                inputMode="numeric"
                placeholder="25.000"
                value={unitPrice}
                onChange={(e) => {
                  const num = parseNumberInput(e.target.value);
                  setUnitPrice(num > 0 ? formatNumberInput(num) : "");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem();
                  }
                }}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none min-touch-target"
              />
            </div>
          </div>

          {/* Add Button */}
          <div className="col-span-12 sm:col-span-3">
            <button
              type="button"
              onClick={addItem}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 min-touch-target"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>{items.length} Menu Tercatat</span>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
            <Utensils className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-500">
              Belum ada menu yang ditambahkan
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Gunakan form di atas untuk menambahkan menu pesanan.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs"
              >
                <div className="flex-1 pr-3">
                  <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span>
                      {item.quantity} × {formatCurrency(item.unitPrice, currency)}
                    </span>
                    <span>=</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(item.totalPrice, currency)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => updateItemQty(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-90 transition shadow-2xs"
                      aria-label="Kurangi"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-xs text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateItemQty(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-90 transition shadow-2xs"
                      aria-label="Tambah"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition min-touch-target flex items-center justify-center"
                    aria-label={`Hapus ${item.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        description={alertConfig.description}
        variant={alertConfig.variant}
      />
    </div>
  );
}
