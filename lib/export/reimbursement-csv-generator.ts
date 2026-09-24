import {
  BillCalculationResult,
  BillData,
  CorporateReimbursementProfile,
} from "../types/bill";
import { formatTerbilangRupiah } from "../utils/terbilang";

function escapeCSV(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes("\"") || str.includes("\n") || str.includes(";")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Menghasilkan string CSV berstandar internasional dengan UTF-8 BOM untuk Microsoft Excel & Google Sheets
 */
export function generateReimbursementCSV(
  bill: BillData,
  result: BillCalculationResult,
  profile?: CorporateReimbursementProfile
): string {
  const rows: string[] = [];

  // Metadata Header Laporan
  rows.push("LAPORAN KLAIM PENGGANTIAN BIAYA OPERASIONAL (REIMBURSEMENT CLAIM)");
  rows.push("");
  rows.push(`No. Dokumen,${escapeCSV(profile?.claimNumber || `CLAIM-${bill.id.slice(0, 8).toUpperCase()}`)}`);
  rows.push(`Tanggal Transaksi,${escapeCSV(bill.date)}`);
  rows.push(`Nama Perusahaan,${escapeCSV(profile?.companyName || "Perusahaan / Kantor")}`);
  rows.push(`Nama Karyawan / Pemohon,${escapeCSV(profile?.employeeName || "Karyawan")}`);
  if (profile?.employeeId) {
    rows.push(`NIK / ID Karyawan,${escapeCSV(profile.employeeId)}`);
  }
  if (profile?.department) {
    rows.push(`Departemen / Divisi,${escapeCSV(profile.department)}`);
  }
  rows.push(`Vendor / Restoran,${escapeCSV(bill.title)}`);
  rows.push(`Kategori Pengeluaran,${escapeCSV(profile?.expenseCategory || "Makan Siang Tim / Rapat Bisnis")}`);
  if (profile?.notes) {
    rows.push(`Keterangan Keperluan,${escapeCSV(profile.notes)}`);
  }
  rows.push("");

  // Bagian 1: Rincian Menu Pesanan
  rows.push("--- RINCIAN MENU & PESANAN ---");
  rows.push(
    [
      "No",
      "Nama Menu",
      "Jumlah (Qty)",
      "Harga Satuan (IDR)",
      "Total Biaya (IDR)",
    ].map(escapeCSV).join(",")
  );

  bill.items.forEach((item, index) => {
    rows.push(
      [
        index + 1,
        item.name,
        item.quantity,
        item.unitPrice,
        item.totalPrice,
      ].map(escapeCSV).join(",")
    );
  });

  // Ringkasan Keuangan
  rows.push("");
  rows.push(["", "", "", "Subtotal", result.subtotal].map(escapeCSV).join(","));
  if (result.discountAmount > 0) {
    rows.push(["", "", "", "Diskon", -result.discountAmount].map(escapeCSV).join(","));
  }
  if (result.serviceChargeAmount > 0) {
    rows.push(["", "", "", "Service Charge", result.serviceChargeAmount].map(escapeCSV).join(","));
  }
  if (result.taxAmount > 0) {
    rows.push(["", "", "", "Pajak Restoran (PB1)", result.taxAmount].map(escapeCSV).join(","));
  }
  if (result.additionalFeeAmount > 0) {
    rows.push(["", "", "", "Biaya Tambahan", result.additionalFeeAmount].map(escapeCSV).join(","));
  }
  if (result.roundingAdjustment !== 0) {
    rows.push(["", "", "", "Pembulatan", result.roundingAdjustment].map(escapeCSV).join(","));
  }
  rows.push(["", "", "", "TOTAL KLAIM REIMBURSE (IDR)", result.finalGrandTotal].map(escapeCSV).join(","));
  rows.push(`Terbilang,${escapeCSV(formatTerbilangRupiah(result.finalGrandTotal))}`);
  rows.push("");

  // Bagian 2: Daftar Hadir Karyawan / Peserta (Untuk Audit & Pajak)
  rows.push("--- DAFTAR HADIR REKAN / KARYAWAN (AUDIT TRAIL) ---");
  rows.push(
    [
      "No",
      "Nama Karyawan / Rekan",
      "Total Porsi/Pesanan (IDR)",
      "Pajak Proporsional (IDR)",
      "Service Proporsional (IDR)",
      "Total Beban per Orang (IDR)",
      "Status Pelunasan",
    ].map(escapeCSV).join(",")
  );

  result.participants.forEach((p, idx) => {
    rows.push(
      [
        idx + 1,
        p.name,
        p.itemSubtotal,
        p.proportionalTax,
        p.proportionalService,
        p.finalTotal,
        p.paymentStatus === "paid" ? "Lunas" : "Belum Lunas",
      ].map(escapeCSV).join(",")
    );
  });

  rows.push("");
  rows.push("Dibuat otomatis oleh Smart Bill Expense Splitter");

  // Sisipkan UTF-8 BOM agar Excel tidak salah membaca encoding
  return `\uFEFF${rows.join("\r\n")}`;
}

/**
 * Men-download file CSV ke komputer / perangkat mobile
 */
export function downloadReimbursementCSV(
  bill: BillData,
  result: BillCalculationResult,
  profile?: CorporateReimbursementProfile,
  filename?: string
): void {
  const csvContent = generateReimbursementCSV(bill, result, profile);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const cleanDate = bill.date ? bill.date.replace(/[^0-9]/g, "") : "date";
  const cleanTitle = bill.title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const safeFilename = filename || `Reimburse_${cleanTitle}_${cleanDate}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", safeFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
