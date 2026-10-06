import { StoredBillRecord } from "@/lib/storage/bill-storage";
import { formatCurrency, formatDateIndonesian } from "@/lib/utils";
import * as XLSX from "xlsx";

export interface MonthSummary {
  monthKey: string; // e.g. "2026-10"
  monthLabel: string; // e.g. "Oktober 2026"
  year: number;
  month: number;
  totalAmount: number;
  totalBills: number;
  paidBills: number;
  unpaidBills: number;
  totalPeople: number;
  uniqueParticipants: string[];
  averagePerBill: number;
  bills: StoredBillRecord[];
}

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function getMonthKeyFromDate(dateStr: string | undefined | null): string {
  if (!dateStr) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  // Handle YYYY-MM-DD or ISO strings
  const match = dateStr.match(/^(\d{4})-(\d{1,2})/);
  if (match) {
    const year = match[1];
    const month = String(parseInt(match[2], 10)).padStart(2, "0");
    return `${year}-${month}`;
  }

  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;

  if (monthIdx >= 0 && monthIdx < 12) {
    return `${MONTH_NAMES_ID[monthIdx]} ${year}`;
  }
  return monthKey;
}

/**
 * Group bills by month and calculate aggregated stats
 */
export function groupBillsByMonth(bills: StoredBillRecord[]): MonthSummary[] {
  const groups = new Map<string, StoredBillRecord[]>();

  for (const record of bills) {
    const dateSource = record.bill?.date || record.updatedAt || record.bill?.createdAt;
    const monthKey = getMonthKeyFromDate(dateSource);

    if (!groups.has(monthKey)) {
      groups.set(monthKey, []);
    }
    groups.get(monthKey)!.push(record);
  }

  const result: MonthSummary[] = [];

  for (const [monthKey, groupBills] of groups.entries()) {
    const [yearStr, monthStr] = monthKey.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    let totalAmount = 0;
    let paidBills = 0;
    let unpaidBills = 0;
    let totalPeople = 0;
    const participantSet = new Set<string>();

    for (const b of groupBills) {
      const amount = b.result?.finalGrandTotal || 0;
      totalAmount += amount;

      const allPaid = b.result?.participants?.every((p) => p.paymentStatus === "paid") ?? false;
      if (allPaid) {
        paidBills += 1;
      } else {
        unpaidBills += 1;
      }

      const pCount = b.bill?.participants?.length || 0;
      totalPeople += pCount;

      b.bill?.participants?.forEach((p) => {
        if (p.name && p.name.trim()) {
          participantSet.add(p.name.trim().toLowerCase());
        }
      });
    }

    const totalBills = groupBills.length;
    const averagePerBill = totalBills > 0 ? Math.round(totalAmount / totalBills) : 0;

    // Sort bills in this month by newest first
    const sortedBills = [...groupBills].sort((a, b) => {
      const tA = new Date(a.bill.date || a.updatedAt).getTime();
      const tB = new Date(b.bill.date || b.updatedAt).getTime();
      return tB - tA;
    });

    result.push({
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      year,
      month,
      totalAmount,
      totalBills,
      paidBills,
      unpaidBills,
      totalPeople,
      uniqueParticipants: Array.from(participantSet),
      averagePerBill,
      bills: sortedBills,
    });
  }

  // Sort months descending (latest month first)
  result.sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  return result;
}

/**
 * Generates formatted text report for WhatsApp or Notes
 */
export function generateMonthlyReportText(summary: MonthSummary): string {
  const lines: string[] = [
    `📊 *REKAP TAGIHAN SMART BILL*`,
    `🗓️ *Periode:* ${summary.monthLabel}`,
    `----------------------------------------`,
    `💰 *Total Pengeluaran:* ${formatCurrency(summary.totalAmount, "IDR")}`,
    `🧾 *Total Tagihan:* ${summary.totalBills} sesi`,
    `✅ *Lunas:* ${summary.paidBills} tagihan`,
    `⏳ *Belum Lunas:* ${summary.unpaidBills} tagihan`,
    `👥 *Total Teman Displit:* ${summary.totalPeople} orang`,
    `📈 *Rata-rata per Sesi:* ${formatCurrency(summary.averagePerBill, "IDR")}`,
    `----------------------------------------`,
    `📝 *Rincian Tagihan:*`,
  ];

  summary.bills.forEach((b, idx) => {
    const isPaid = b.result.participants.every((p) => p.paymentStatus === "paid");
    const statusText = isPaid ? "✅ Lunas" : "⏳ Belum Lunas";
    const dateFormatted = formatDateIndonesian(b.bill.date || b.updatedAt);
    lines.push(
      `${idx + 1}. *${b.bill.title}* (${dateFormatted})` +
      `\n   • Nominal: ${formatCurrency(b.result.finalGrandTotal, b.bill.currency)}` +
      `\n   • Status: ${statusText} • ${b.bill.participants.length} orang`
    );
  });

  lines.push(`----------------------------------------`);
  lines.push(`Dibuat otomatis via Smart Bill • smart-bill.vercel.app`);

  return lines.join("\n");
}

/**
 * Exports monthly bill summary to Excel (.xlsx) file
 */
export function exportMonthlyReportToExcel(summary: MonthSummary): void {
  if (typeof window === "undefined") return;

  const aoaData: any[][] = [
    ["LAPORAN BULANAN TAGIHAN & PATUNGAN - SMART BILL"],
    [`Periode: ${summary.monthLabel}`],
    [`Tanggal Unduh: ${new Date().toLocaleDateString("id-ID")}`],
    [],
    ["Ringkasan Periode"],
    ["Total Pengeluaran", summary.totalAmount],
    ["Jumlah Sesi Tagihan", summary.totalBills],
    ["Tagihan Lunas", summary.paidBills],
    ["Tagihan Belum Lunas", summary.unpaidBills],
    ["Rata-rata per Sesi", summary.averagePerBill],
    [],
    ["No", "Tanggal", "Nama Acara / Resto", "Total Tagihan (Rp)", "Jumlah Peserta", "Status Pembayaran", "Metode Input"],
  ];

  summary.bills.forEach((b, idx) => {
    const isPaid = b.result.participants.every((p) => p.paymentStatus === "paid");
    const paidCount = b.result.participants.filter((p) => p.paymentStatus === "paid").length;
    const statusStr = isPaid
      ? "Lunas"
      : paidCount > 0
      ? `Sebagian (${paidCount}/${b.result.participants.length})`
      : "Belum Bayar";

    aoaData.push([
      idx + 1,
      b.bill.date || formatDateIndonesian(b.updatedAt),
      b.bill.title,
      b.result.finalGrandTotal,
      b.bill.participants.length,
      statusStr,
      b.bill.source === "scan" ? "Scan Struk" : "Manual",
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoaData);

  // Set column widths
  ws["!cols"] = [
    { wch: 6 },  // No
    { wch: 14 }, // Tanggal
    { wch: 28 }, // Nama
    { wch: 18 }, // Total Rp
    { wch: 15 }, // Peserta
    { wch: 18 }, // Status
    { wch: 14 }, // Metode
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rekap Bulanan");

  const safeFilename = `Rekap_Smart_Bill_${summary.monthKey}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}
