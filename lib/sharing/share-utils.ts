import {
  BillCalculationResult,
  BillData,
  HostPaymentProfile,
  ParticipantCalculation,
} from "../types/bill";
import { formatCurrency } from "../utils";

export function formatWhatsAppPhone(inputPhone?: string): string {
  if (!inputPhone) return "";
  let cleaned = inputPhone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  if (cleaned.startsWith("08")) cleaned = "628" + cleaned.slice(2);
  else if (cleaned.startsWith("0")) cleaned = "62" + cleaned.slice(1);
  return cleaned;
}

export function buildWhatsAppUrl(phone?: string, text?: string): string {
  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text || "");
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

export function generateWhatsAppSummary(
  bill: BillData,
  result: BillCalculationResult,
  profile?: HostPaymentProfile | null
): string {
  const lines: string[] = [];

  lines.push(`🧾 *TAGIHAN: ${bill.title.toUpperCase()}*`);
  lines.push(`📅 Tanggal: ${bill.date}`);
  lines.push(`💵 Total: ${formatCurrency(result.finalGrandTotal, bill.currency)}`);
  lines.push(`---------------------------------`);

  result.participants.forEach((p) => {
    const statusIcon = p.paymentStatus === "paid" ? "✅ [LUNAS]" : "⏳ [BELUM]";
    lines.push(`\n👤 *${p.name}*: *${formatCurrency(p.finalTotal, bill.currency)}* ${statusIcon}`);

    p.items.forEach((it) => {
      lines.push(`  • ${it.itemName}: ${formatCurrency(it.allocatedAmount, bill.currency)}`);
    });

    const feeTotal = p.proportionalTax + p.proportionalService + p.proportionalAdditionalFee - p.proportionalDiscount;
    if (feeTotal !== 0) {
      lines.push(`  • Pajak/Layanan/Diskon: ${feeTotal > 0 ? "+" : ""}${formatCurrency(feeTotal, bill.currency)}`);
    }
  });

  if (profile && profile.accounts && profile.accounts.length > 0) {
    lines.push(`\n---------------------------------`);
    lines.push(`💳 *Tujuan Transfer (${profile.hostName || "Penagih"}):*`);
    profile.accounts.forEach((acc) => {
      lines.push(`• ${acc.provider}: *${acc.accountNumber}* (a.n ${acc.accountHolder})`);
    });
    if (profile.qrisImageUrl) {
      lines.push(`*(QRIS tersedia)*`);
    }
    if (profile.customNotes) {
      lines.push(`Catatan: ${profile.customNotes}`);
    }
  }

  lines.push(`\n---------------------------------`);
  lines.push(`Dihitung otomatis dengan *Smart Bill Splitter* ⚡`);

  return lines.join("\n");
}

export function generatePersonalWhatsAppMessage(
  bill: BillData,
  participant: ParticipantCalculation,
  profile?: HostPaymentProfile | null
): string {
  const lines: string[] = [];

  lines.push(`Hai *${participant.name}*! 👋`);
  lines.push(`Berikut rincian patungan untuk *${bill.title}*:`);
  lines.push(``);
  lines.push(`🍽️ *Pesanan kamu:*`);

  participant.items.forEach((it) => {
    lines.push(`• ${it.itemName}: ${formatCurrency(it.allocatedAmount, bill.currency)}`);
  });

  const feeTotal =
    participant.proportionalTax +
    participant.proportionalService +
    participant.proportionalAdditionalFee -
    participant.proportionalDiscount;

  if (feeTotal !== 0) {
    lines.push(`• Pajak/Layanan/Diskon: ${feeTotal > 0 ? "+" : ""}${formatCurrency(feeTotal, bill.currency)}`);
  }

  lines.push(``);
  lines.push(`💰 *Total bagianmu: ${formatCurrency(participant.finalTotal, bill.currency)}*`);

  if (participant.paymentStatus === "paid") {
    lines.push(`Status: ✅ *Sudah Lunas* (Terima kasih!)`);
  } else {
    lines.push(`Status: ⏳ *Belum Lunas*`);
  }

  // Host payment destination
  if (profile && profile.accounts && profile.accounts.length > 0) {
    lines.push(``);
    lines.push(`💳 *Pilihan Rekening Transfer (${profile.hostName || "Penagih"}):*`);
    profile.accounts.forEach((acc) => {
      lines.push(`• ${acc.provider}: *${acc.accountNumber}* (a.n ${acc.accountHolder})`);
    });
    if (profile.qrisImageUrl) {
      lines.push(`*(QRIS pembayaran tersedia di web tagihan)*`);
    }
    if (profile.customNotes) {
      lines.push(`Catatan: ${profile.customNotes}`);
    }
  }

  lines.push(``);
  lines.push(`Terima kasih banyak! 🙏✨`);
  lines.push(`_Dihitung otomatis via Smart Bill_ ⚡`);

  return lines.join("\n");
}

export async function shareBill(
  bill: BillData,
  result: BillCalculationResult,
  profile?: HostPaymentProfile | null
): Promise<{ method: "native" | "clipboard" }> {
  const text = generateWhatsAppSummary(bill, result, profile);
  const shareData = {
    title: `Smart Bill: ${bill.title}`,
    text: text,
  };

  if (typeof navigator !== "undefined" && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return { method: "native" };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return { method: "native" };
      }
    }
  }

  // Fallback to clipboard
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return { method: "clipboard" };
  }

  return { method: "clipboard" };
}

