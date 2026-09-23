"use client";

import React from "react";
import { BillData } from "@/lib/types/bill";
import { Calendar, ReceiptText, DollarSign } from "lucide-react";

interface StepInfoProps {
  bill: BillData;
  onChange: (updated: Partial<BillData>) => void;
}

export function StepInfo({ bill, onChange }: StepInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Informasi Tagihan
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Beri nama acara makan dan tentukan tanggal tagihan.
        </p>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label
            htmlFor="bill-title"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
          >
            Nama Acara / Restoran
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <ReceiptText className="w-5 h-5" />
            </div>
            <input
              id="bill-title"
              type="text"
              value={bill.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Contoh: Makan Malam di Solaria"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none min-touch-target"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label
            htmlFor="bill-date"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
          >
            Tanggal
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-5 h-5" />
            </div>
            <input
              id="bill-date"
              type="date"
              value={bill.date}
              onChange={(e) => onChange({ date: e.target.value })}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none min-touch-target"
            />
          </div>
        </div>

        {/* Currency */}
        <div>
          <label
            htmlFor="bill-currency"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
          >
            Mata Uang
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <select
              id="bill-currency"
              value={bill.currency}
              onChange={(e) => onChange({ currency: e.target.value })}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none min-touch-target appearance-none"
            >
              <option value="IDR">Rupiah Indonesia (IDR - Rp)</option>
              <option value="USD">US Dollar (USD - $)</option>
              <option value="SGD">Singapore Dollar (SGD - S$)</option>
              <option value="MYR">Malaysian Ringgit (MYR - RM)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
