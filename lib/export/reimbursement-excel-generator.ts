import * as XLSX from "xlsx";
import {
  BillCalculationResult,
  BillData,
  CorporateReimbursementProfile,
} from "../types/bill";
import { formatTerbilangRupiah } from "../utils/terbilang";

/**
 * Menghasilkan Excel Workbook (.xlsx) resmi untuk klaim reimbursement kantor
 */
export function generateReimbursementWorkbook(
  bill: BillData,
  result: BillCalculationResult,
  profile?: CorporateReimbursementProfile
): XLSX.WorkBook {
  const claimNumber =
    profile?.claimNumber || `CLM-${bill.id.slice(0, 8).toUpperCase()}`;

  const data: (string | number)[][] = [
    // Judul Dokumen
    ["LAPORAN KLAIM PENGGANTIAN BIAYA (EXPENSE REIMBURSEMENT CLAIM)"],
    [],
    // Metadata Header
    ["No. Dokumen:", claimNumber, "", "Tanggal Transaksi:", bill.date],
    [
      "Nama Perusahaan:",
      profile?.companyName || "-",
      "",
      "Nama Merchant:",
      bill.title,
    ],
    [
      "Nama Pemohon:",
      profile?.employeeName || "Karyawan",
      "",
      "Kategori Biaya:",
      profile?.expenseCategory || "Makan Siang Tim (Team Lunch)",
    ],
    [
      "NIK / ID Karyawan:",
      profile?.employeeId || "-",
      "",
      "Keperluan:",
      profile?.notes || "Operasional makan siang bersama",
    ],
    [
      "Departemen / Divisi:",
      profile?.department || "Operasional",
      "",
      "",
      "",
    ],
    [],
    // Bagian 1: Rincian Menu Pesanan
    ["1. RINCIAN MENU & PESANAN"],
    [
      "No",
      "Deskripsi Menu / Item",
      "Jumlah (Qty)",
      "Harga Satuan (IDR)",
      "Total Biaya (IDR)",
    ],
  ];

  // Baris-baris item
  bill.items.forEach((item, index) => {
    data.push([
      index + 1,
      item.name,
      item.quantity,
      item.unitPrice,
      item.totalPrice,
    ]);
  });

  // Ringkasan Keuangan
  data.push(["", "", "", "Subtotal Makanan & Minuman", result.subtotal]);

  if (result.discountAmount > 0) {
    data.push(["", "", "", "Potongan / Diskon", -result.discountAmount]);
  }
  if (result.serviceChargeAmount > 0) {
    data.push([
      "",
      "",
      "",
      `Service Charge (${bill.charges.serviceRate}%)`,
      result.serviceChargeAmount,
    ]);
  }
  if (result.taxAmount > 0) {
    data.push([
      "",
      "",
      "",
      `Pajak Restoran / PB1 (${bill.charges.taxRate}%)`,
      result.taxAmount,
    ]);
  }
  if (result.additionalFeeAmount > 0) {
    data.push(["", "", "", "Biaya Tambahan", result.additionalFeeAmount]);
  }
  if (result.roundingAdjustment !== 0) {
    data.push([
      "",
      "",
      "",
      "Penyesuaian Pembulatan",
      result.roundingAdjustment,
    ]);
  }

  // Total Akhir
  data.push([
    "",
    "",
    "",
    "TOTAL PENGAJUAN KLAIM REIMBURSE (IDR)",
    result.finalGrandTotal,
  ]);
  data.push([
    "Terbilang:",
    formatTerbilangRupiah(result.finalGrandTotal),
    "",
    "",
    "",
  ]);
  data.push([]);

  // Bagian 2: Daftar Hadir Karyawan / Peserta (Audit Trail)
  data.push(["2. DAFTAR HADIR REKAN / KARYAWAN (AUDIT TRAIL)"]);
  data.push([
    "No",
    "Nama Karyawan / Rekan",
    "Pesanan (IDR)",
    "Pajak & Layanan Proporsional (IDR)",
    "Total Beban per Orang (IDR)",
    "Status Pelunasan",
  ]);

  result.participants.forEach((p, idx) => {
    const taxAndService = p.proportionalTax + p.proportionalService;
    data.push([
      idx + 1,
      p.name,
      p.itemSubtotal,
      taxAndService,
      p.finalTotal,
      p.paymentStatus === "paid" ? "Lunas" : "Belum Lunas",
    ]);
  });

  data.push([]);
  data.push([
    "Dibuat secara otomatis oleh Smart Bill Expense Splitter (project-smart-bill.vercel.app)",
  ]);

  // Buat Worksheet & Workbook
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Atur lebar kolom (column widths) agar tampilan di Excel tidak terpotong
  ws["!cols"] = [
    { wch: 6 }, // A: No
    { wch: 36 }, // B: Deskripsi / Nama
    { wch: 14 }, // C: Qty / Nilai
    { wch: 28 }, // D: Label / Harga Satuan
    { wch: 28 }, // E: Total Biaya
    { wch: 18 }, // F: Status
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Klaim Reimbursement");

  return wb;
}

/**
 * Men-download file spreadsheet Excel (.xlsx) resmi ke komputer atau perangkat mobile
 */
export function downloadReimbursementExcel(
  bill: BillData,
  result: BillCalculationResult,
  profile?: CorporateReimbursementProfile,
  filename?: string
): void {
  const wb = generateReimbursementWorkbook(bill, result, profile);
  const cleanDate = bill.date ? bill.date.replace(/[^0-9]/g, "") : "date";
  const cleanTitle = bill.title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const safeFilename = filename || `Reimburse_${cleanTitle}_${cleanDate}.xlsx`;

  // Tulis file workbook ke array buffer
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Trigger download via anchor element
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", safeFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
