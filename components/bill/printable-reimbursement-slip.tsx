"use client";

import React from "react";
import {
  BillCalculationResult,
  BillData,
  CorporateReimbursementProfile,
} from "@/lib/types/bill";
import { formatCurrency } from "@/lib/utils";
import { formatTerbilangRupiah } from "@/lib/utils/terbilang";

interface PrintableReimbursementSlipProps {
  bill: BillData;
  result: BillCalculationResult;
  profile: CorporateReimbursementProfile;
}

export function PrintableReimbursementSlip({
  bill,
  result,
  profile,
}: PrintableReimbursementSlipProps) {
  const claimNumber =
    profile.claimNumber || `CLM-${bill.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="printable-reimbursement-document font-sans text-slate-900 bg-white leading-normal">
      {/* ========================================================================= */}
      {/* HALAMAN 1: FORMULIR KLAIM PENGGANTIAN BIAYA                               */}
      {/* ========================================================================= */}
      <div className="a4-page w-[210mm] max-w-[210mm] mx-auto p-[12mm_15mm] box-border bg-white text-slate-900 text-xs">
        {/* Header Kop Surat */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo placeholder / Icon */}
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-black text-lg flex items-center justify-center shrink-0 border border-slate-900">
              SB
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-normal text-slate-900 uppercase">
                {profile.companyName || "PT ASCON INOVASI DATA"}
              </h1>
              <p className="text-[11px] text-slate-600 font-semibold tracking-wide uppercase">
                Formulir Klaim Penggantian Biaya (Expense Reimbursement Claim)
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 text-[11px] font-bold bg-slate-100 border border-slate-300 rounded text-slate-800">
              No: {claimNumber}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Tgl: {bill.date}
            </p>
          </div>
        </div>

        {/* Informasi Pemohon & Dokumen (Grid 2 Kolom) */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4 text-xs">
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-32 font-bold text-slate-600">Nama Pemohon:</span>
              <span className="font-semibold text-slate-900">{profile.employeeName || "-"}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-bold text-slate-600">NIK / ID Karyawan:</span>
              <span className="text-slate-800">{profile.employeeId || "-"}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-bold text-slate-600">Divisi / Dept:</span>
              <span className="text-slate-800">{profile.department || "Operasional"}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-32 font-bold text-slate-600">Nama Merchant:</span>
              <span className="font-semibold text-slate-900">{bill.title}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-bold text-slate-600">Kategori Biaya:</span>
              <span className="text-slate-800">{profile.expenseCategory || "Makan Siang Tim (Team Lunch)"}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-bold text-slate-600">Keperluan:</span>
              <span className="text-slate-800">{profile.notes || "Operasional pertemuan makan bersama"}</span>
            </div>
          </div>
        </div>

        {/* Tabel 1: Rincian Item / Menu Pesanan */}
        <div className="mb-4 print-avoid-break">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            1. Rincian Item / Menu Pesanan
          </h2>
          <table className="w-full text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="py-2 px-2 text-center w-10 border-r border-slate-300">No</th>
                <th className="py-2 px-3 text-left border-r border-slate-300">Deskripsi Menu / Item</th>
                <th className="py-2 px-2 text-center w-16 border-r border-slate-300">Qty</th>
                <th className="py-2 px-3 text-right w-28 border-r border-slate-300">Harga Satuan</th>
                <th className="py-2 px-3 text-right w-32">Total Biaya</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, idx) => (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className="py-1.5 px-2 text-center border-r border-slate-200 text-slate-600">
                    {idx + 1}
                  </td>
                  <td className="py-1.5 px-3 font-medium border-r border-slate-200">
                    {item.name}
                  </td>
                  <td className="py-1.5 px-2 text-center border-r border-slate-200">
                    {item.quantity}
                  </td>
                  <td className="py-1.5 px-3 text-right border-r border-slate-200 text-slate-600">
                    {formatCurrency(item.unitPrice, bill.currency)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-semibold">
                    {formatCurrency(item.totalPrice, bill.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-300">
                <td colSpan={4} className="py-1.5 px-3 text-right font-semibold text-slate-600 border-r border-slate-200">
                  Subtotal Makanan & Minuman
                </td>
                <td className="py-1.5 px-3 text-right font-bold">
                  {formatCurrency(result.subtotal, bill.currency)}
                </td>
              </tr>
              {result.discountAmount > 0 && (
                <tr className="border-t border-slate-200 text-emerald-700">
                  <td colSpan={4} className="py-1 px-3 text-right border-r border-slate-200">
                    Potongan / Diskon
                  </td>
                  <td className="py-1 px-3 text-right font-medium">
                    -{formatCurrency(result.discountAmount, bill.currency)}
                  </td>
                </tr>
              )}
              {result.serviceChargeAmount > 0 && (
                <tr className="border-t border-slate-200">
                  <td colSpan={4} className="py-1 px-3 text-right text-slate-600 border-r border-slate-200">
                    Service Charge ({bill.charges.serviceRate}%)
                  </td>
                  <td className="py-1 px-3 text-right">
                    {formatCurrency(result.serviceChargeAmount, bill.currency)}
                  </td>
                </tr>
              )}
              {result.taxAmount > 0 && (
                <tr className="border-t border-slate-200">
                  <td colSpan={4} className="py-1 px-3 text-right text-slate-600 border-r border-slate-200">
                    Pajak Restoran / PB1 ({bill.charges.taxRate}%)
                  </td>
                  <td className="py-1 px-3 text-right">
                    {formatCurrency(result.taxAmount, bill.currency)}
                  </td>
                </tr>
              )}
              {result.additionalFeeAmount > 0 && (
                <tr className="border-t border-slate-200">
                  <td colSpan={4} className="py-1 px-3 text-right text-slate-600 border-r border-slate-200">
                    Biaya Tambahan
                  </td>
                  <td className="py-1 px-3 text-right">
                    {formatCurrency(result.additionalFeeAmount, bill.currency)}
                  </td>
                </tr>
              )}
              {result.roundingAdjustment !== 0 && (
                <tr className="border-t border-slate-200 text-slate-500">
                  <td colSpan={4} className="py-1 px-3 text-right border-r border-slate-200">
                    Penyesuaian Pembulatan
                  </td>
                  <td className="py-1 px-3 text-right">
                    {formatCurrency(result.roundingAdjustment, bill.currency)}
                  </td>
                </tr>
              )}
              <tr className="border-t-2 border-slate-900 bg-slate-50 text-slate-900">
                <td colSpan={4} className="py-2.5 px-3 text-right font-black uppercase text-xs border-r border-slate-300">
                  Total Pengajuan Klaim Reimburse
                </td>
                <td className="py-2.5 px-3 text-right font-black text-sm text-slate-900">
                  {formatCurrency(result.finalGrandTotal, bill.currency)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Terbilang */}
          <div className="p-2 bg-slate-50 border-x border-b border-slate-300 text-xs italic text-slate-700">
            <span className="font-bold not-italic">Terbilang: </span>
            {formatTerbilangRupiah(result.finalGrandTotal)}
          </div>
        </div>

        {/* Tabel 2: Daftar Hadir Karyawan / Peserta (Audit Trail) */}
        <div className="mb-5 print-avoid-break">
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Daftar Hadir Karyawan / Peserta ({result.participants.length} Orang)
            </h2>
            <span className="text-[10px] text-slate-500 italic">
              *Syarat kepatuhan audit internal & perpajakan
            </span>
          </div>
          <table className="w-full text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="py-1.5 px-2 text-center w-10 border-r border-slate-300">No</th>
                <th className="py-1.5 px-3 text-left border-r border-slate-300">Nama Rekan / Karyawan</th>
                <th className="py-1.5 px-3 text-right w-28 border-r border-slate-300">Pesanan (IDR)</th>
                <th className="py-1.5 px-3 text-right w-28 border-r border-slate-300">Total Beban (IDR)</th>
                <th className="py-1.5 px-3 text-center w-36">Tanda Tangan / Paraf</th>
              </tr>
            </thead>
            <tbody>
              {result.participants.map((p, idx) => (
                <tr key={p.participantId} className="border-b border-slate-200">
                  <td className="py-1 px-2 text-center border-r border-slate-200 text-slate-600">
                    {idx + 1}
                  </td>
                  <td className="py-1 px-3 font-medium border-r border-slate-200">
                    {p.name}
                  </td>
                  <td className="py-1 px-3 text-right border-r border-slate-200 text-slate-600">
                    {formatCurrency(p.itemSubtotal, bill.currency)}
                  </td>
                  <td className="py-1 px-3 text-right font-semibold border-r border-slate-200">
                    {formatCurrency(p.finalTotal, bill.currency)}
                  </td>
                  <td className="py-1 px-3 text-center">
                    <div className="w-24 mx-auto border-b border-slate-400 h-4"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Kolom Tanda Tangan Otorisasi (3 Kolom) */}
        <div className="print-avoid-break grid grid-cols-3 gap-3 border border-slate-300 text-xs text-center p-3 rounded-lg bg-white">
          <div className="flex flex-col justify-between h-28 border-r border-slate-200 pr-2">
            <p className="font-bold text-slate-700">Diajukan Oleh (Pemohon):</p>
            <div>
              <div className="w-32 mx-auto border-b border-slate-700 mb-1"></div>
              <p className="font-bold text-slate-900">
                {profile.employeeName || "Karyawan"}
              </p>
              <p className="text-[10px] text-slate-500">Tgl: {bill.date}</p>
            </div>
          </div>

          <div className="flex flex-col justify-between h-28 border-r border-slate-200 px-2">
            <p className="font-bold text-slate-700">Diperiksa Oleh (Finance):</p>
            <div>
              <div className="w-32 mx-auto border-b border-slate-400 mb-1"></div>
              <p className="text-slate-600 text-[11px]">Bagian Keuangan / Finance</p>
              <p className="text-[10px] text-slate-500">Tgl: ______________</p>
            </div>
          </div>

          <div className="flex flex-col justify-between h-28 pl-2">
            <p className="font-bold text-slate-700">Disetujui Oleh (Atasan/Head):</p>
            <div>
              <div className="w-32 mx-auto border-b border-slate-400 mb-1"></div>
              <p className="text-slate-600 text-[11px]">Atasan Langsung / Manager</p>
              <p className="text-[10px] text-slate-500">Tgl: ______________</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HALAMAN 2: LAMPIRAN BUKTI FISIK STRUK ASLI (RECEIPT ATTACHMENT)          */}
      {/* ========================================================================= */}
      {bill.receiptImageUrl && (
        <div className="print-page-break a4-page w-[210mm] max-w-[210mm] mx-auto p-[12mm_15mm] box-border bg-white text-slate-900 font-sans text-xs">
          <div className="border-b-2 border-slate-900 pb-2.5 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-normal uppercase text-slate-900">
                Lampiran Bukti Fisik Struk Asli (Original Receipt)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Nomor Dokumen: <span className="font-bold text-slate-800">{claimNumber}</span> | Vendor: <span className="font-semibold text-slate-800">{bill.title}</span> | Tanggal: {bill.date}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 text-[11px] font-bold bg-slate-100 border border-slate-300 rounded text-slate-800">
                Lampiran Hal. 2
              </span>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50">
            <div className="max-w-md w-full bg-white p-2 rounded-lg shadow-xs border border-slate-200 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bill.receiptImageUrl}
                alt="Bukti Struk Fisik"
                className="max-w-full max-h-[190mm] object-contain rounded mx-auto"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-3 text-center font-medium">
              Dokumen bukti transaksi fisik asli yang dilampirkan sebagai syarat sah verifikasi perpajakan & audit internal bagian Finance/HRD.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
