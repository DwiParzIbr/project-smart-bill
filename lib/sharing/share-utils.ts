import { BillCalculationResult, BillData } from "../types/bill";
import { formatCurrency } from "../utils";

export function generateWhatsAppSummary(
  bill: BillData,
  result: BillCalculationResult
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

  lines.push(`\n---------------------------------`);
  lines.push(`Dihitung otomatis dengan *Smart Bill Splitter* ⚡`);

  return lines.join("\n");
}

export async function shareBill(
  bill: BillData,
  result: BillCalculationResult
): Promise<{ method: "native" | "clipboard" }> {
  const text = generateWhatsAppSummary(bill, result);
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
