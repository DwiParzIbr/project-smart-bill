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
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          /* Sembunyikan elemen web biasa saat cetak */
          header,
          footer,
          nav,
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* HALAMAN 1: FORMULIR KLAIM PENGGANTIAN BIAYA                               */}
      {/* ========================================================================= */}
      <div className="max-w-[210mm] mx-auto p-4 sm:p-6 print:p-0">
        {/* Header Kop Surat */}
        <div className="border-b-2 border-slate-900 pb-3 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo placeholder / Icon */}
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-black text-xl flex items-center justify-center shrink-0 print:border print:border-black">
              SB
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 uppercase">
                {profile.companyName || "PT PERUSAHAAN INDONESIA"}
              </h1>
              <p className="text-xs text-slate-600 font-semibold tracking-wider uppercase">
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
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-5 text-xs">
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
              <span className="text-slate-800">{profile.expenseCategory || "Makan Tim / Jamuan Klien"}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-bold text-slate-600">Keperluan:</span>
              <span className="text-slate-800">{profile.notes || "Operasional pertemuan makan bersama"}</span>
            </div>
          </div>
        </div>

        {/* Tabel 1: Rincian Menu Pesanan */}
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            1. Rincian Item / Menu Pesanan
          </h2>
          <table className="w-full text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
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
        <div className="mb-6">
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
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th className="py-1.5 px-2 text-center w-10 border-r border-slate-300">No</th>
                <th className="py-1.5 px-3 text-left border-r border-slate-300">Nama Rekan / Karyawan</th>
                <th className="py-1.5 px-3 text-right w-28 border-r border-slate-300">Pesanan (IDR)</th>
                <th className="py-1.5 px-3 text-right w-28 border-r border-slate-300">Total Beban (IDR)</th>
                <th className="py-1.5 px-3 text-center w-28">Tanda Tangan / Paraf</th>
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
                  <td className="py-1 px-3 text-center text-slate-300">
                    ________________
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Kolom Tanda Tangan Otorisasi (3 Kolom) */}
        <div className="grid grid-cols-3 gap-3 border border-slate-300 text-xs text-center p-3 rounded-lg bg-white">
          <div className="flex flex-col justify-between h-28 border-r border-slate-200 pr-2">
            <p className="font-bold text-slate-700">Diajukan Oleh (Pemohon):</p>
            <div>
              <p className="font-bold underline text-slate-900">
                {profile.employeeName || "Karyawan"}
              </p>
              <p className="text-[10px] text-slate-500">Tgl: {bill.date}</p>
            </div>
          </div>

          <div className="flex flex-col justify-between h-28 border-r border-slate-200 px-2">
            <p className="font-bold text-slate-700">Diperiksa Oleh (Finance):</p>
            <div>
              <p className="text-slate-400">________________________</p>
              <p className="text-[10px] text-slate-500 mt-1">Tgl: ______________</p>
            </div>
          </div>

          <div className="flex flex-col justify-between h-28 pl-2">
            <p className="font-bold text-slate-700">Disetujui Oleh (Atasan/Head):</p>
            <div>
              <p className="text-slate-400">________________________</p>
              <p className="text-[10px] text-slate-500 mt-1">Tgl: ______________</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HALAMAN 2: LAMPIRAN BUKTI FISIK STRUK ASLI (RECEIPT ATTACHMENT)          */}
      {/* ========================================================================= */}
      {bill.receiptImageUrl && (
        <div className="page-break max-w-[210mm] mx-auto p-4 sm:p-6 print:p-0 print:pt-6 mt-8 print:mt-0">
          <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black tracking-tight uppercase text-slate-900">
                Lampiran Bukti Fisik Struk Asli (Original Receipt)
              </h2>
              <p className="text-xs text-slate-600">
                Nomor Dokumen: <span className="font-bold text-slate-800">{claimNumber}</span> | Vendor: {bill.title}
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-500 font-medium">
              Lampiran Halaman 2
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50/50 min-h-[500px]">
            <div className="max-w-md w-full bg-white p-2 rounded-xl shadow-sm border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bill.receiptImageUrl}
                alt="Bukti Struk Fisik"
                className="w-full max-h-[700px] object-contain rounded-lg mx-auto"
              />
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center font-medium">
              Foto struk fisik asli yang diunggah/di-scan sebagai dokumen pendukung klaim biaya.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
