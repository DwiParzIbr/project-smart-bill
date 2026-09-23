"use client";

import React from "react";
import { BillCharges, RoundingMode, RoundingStep, ServiceBasis, TaxBasis } from "@/lib/types/bill";
import { formatNumberInput, parseNumberInput } from "@/lib/utils";
import { Percent, ShieldCheck, Tag, PlusCircle, Coins } from "lucide-react";

interface StepChargesProps {
  charges: BillCharges;
  currency: string;
  onChange: (charges: BillCharges) => void;
}

export function StepCharges({ charges, onChange }: StepChargesProps) {
  const updateCharges = (patch: Partial<BillCharges>) => {
    onChange({ ...charges, ...patch });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Pajak, Layanan & Biaya Tambahan
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Atur persentase pajak restoran, service charge, diskon, dan pembulatan nominal.
        </p>
      </div>

      <div className="space-y-4">
        {/* Tax Card */}
        <div className="p-4 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pajak Restoran (PB1 / PPN)</h3>
                <p className="text-xs text-slate-500">Biasanya 10% atau 11%</p>
              </div>
            </div>
            <div className="flex items-center gap-1 w-24">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                value={charges.taxRate || ""}
                onChange={(e) =>
                  updateCharges({ taxRate: parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
                className="w-full px-2.5 py-2 text-right font-bold text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none min-touch-target"
              />
              <span className="text-xs font-bold text-slate-500">%</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">Dasar Pengenaan Pajak:</span>
            <select
              value={charges.taxBasis}
              onChange={(e) =>
                updateCharges({ taxBasis: e.target.value as TaxBasis })
              }
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none text-xs"
            >
              <option value="after_discount">Setelah Diskon</option>
              <option value="before_discount">Sebelum Diskon (Subtotal)</option>
            </select>
          </div>
        </div>

        {/* Service Charge Card */}
        <div className="p-4 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Service Charge</h3>
                <p className="text-xs text-slate-500">Biaya layanan tempat makan (opsional)</p>
              </div>
            </div>
            <div className="flex items-center gap-1 w-24">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                value={charges.serviceRate || ""}
                onChange={(e) =>
                  updateCharges({ serviceRate: parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
                className="w-full px-2.5 py-2 text-right font-bold text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none min-touch-target"
              />
              <span className="text-xs font-bold text-slate-500">%</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">Dasar Pengenaan Layanan:</span>
            <select
              value={charges.serviceBasis}
              onChange={(e) =>
                updateCharges({ serviceBasis: e.target.value as ServiceBasis })
              }
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none text-xs"
            >
              <option value="before_discount">Subtotal Kotor</option>
              <option value="after_discount">Setelah Diskon</option>
            </select>
          </div>
        </div>

        {/* Discount Card */}
        <div className="p-4 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Diskon Promosi</h3>
                <p className="text-xs text-slate-500">Voucher / potongan harga</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => updateCharges({ discountType: "percentage" })}
                  className={`px-2 py-1 rounded-md transition ${
                    charges.discountType === "percentage"
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-slate-600"
                  }`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => updateCharges({ discountType: "fixed" })}
                  className={`px-2 py-1 rounded-md transition ${
                    charges.discountType === "fixed"
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-slate-600"
                  }`}
                >
                  Rp
                </button>
              </div>

              <input
                type={charges.discountType === "percentage" ? "number" : "text"}
                inputMode={charges.discountType === "percentage" ? "decimal" : "numeric"}
                min="0"
                value={
                  charges.discountType === "percentage"
                    ? charges.discountValue || ""
                    : charges.discountValue > 0
                    ? formatNumberInput(charges.discountValue)
                    : ""
                }
                onChange={(e) => {
                  const val =
                    charges.discountType === "percentage"
                      ? parseFloat(e.target.value) || 0
                      : parseNumberInput(e.target.value);
                  updateCharges({ discountValue: val });
                }}
                placeholder="0"
                className="w-28 px-2.5 py-2 text-right font-bold text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none min-touch-target"
              />
            </div>
          </div>
        </div>

        {/* Additional Fee */}
        <div className="p-4 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <PlusCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Biaya Tambahan Lain</h3>
                <p className="text-xs text-slate-500">Parkir, bungkus / takeaway, ongkir</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-400">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={charges.additionalFee > 0 ? formatNumberInput(charges.additionalFee) : ""}
                onChange={(e) =>
                  updateCharges({ additionalFee: parseNumberInput(e.target.value) })
                }
                placeholder="0"
                className="w-28 px-2.5 py-2 text-right font-bold text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none min-touch-target"
              />
            </div>
          </div>
        </div>

        {/* Rounding Step & Mode */}
        <div className="p-4 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pembulatan Nominal</h3>
              <p className="text-xs text-slate-500">Mempermudah transfer antar teman</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            {[
              { label: "Tanpa", step: 1 },
              { label: "Rp100", step: 100 },
              { label: "Rp500", step: 500 },
              { label: "Rp1.000", step: 1000 },
            ].map((opt) => (
              <button
                key={opt.step}
                type="button"
                onClick={() => updateCharges({ roundingStep: opt.step as RoundingStep })}
                className={`py-2 px-1 text-center font-bold text-xs rounded-xl border transition min-touch-target ${
                  charges.roundingStep === opt.step
                    ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {charges.roundingStep > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-600">Arah Pembulatan:</span>
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                {[
                  { label: "Terdekat", mode: "nearest" },
                  { label: "Ke Atas", mode: "up" },
                  { label: "Ke Bawah", mode: "down" },
                ].map((m) => (
                  <button
                    key={m.mode}
                    type="button"
                    onClick={() => updateCharges({ roundingMode: m.mode as RoundingMode })}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                      charges.roundingMode === m.mode
                        ? "bg-white text-sky-700 shadow-xs"
                        : "text-slate-600"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
