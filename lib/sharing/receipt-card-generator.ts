import { BillCalculationResult, BillData } from "../types/bill";
import { formatCurrency } from "../utils";

export type ReceiptCardTheme = "thermal" | "modern";

/**
 * Generates an aesthetic high-resolution image card (PNG) of the bill using HTML5 Canvas.
 * No external libraries or server calls needed.
 */
export async function generateReceiptCardImage(
  bill: BillData,
  result: BillCalculationResult,
  theme: ReceiptCardTheme = "thermal"
): Promise<string> {
  if (typeof window === "undefined") return "";

  // Wait for fonts if available
  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

  if (theme === "thermal") {
    return renderThermalReceipt(bill, result);
  } else {
    return renderModernCard(bill, result);
  }
}

/**
 * Renders Classic Aesthetic Thermal Paper Receipt with jagged torn edges,
 * monospaced typography, dotted line dividers, and barcode illustration.
 */
function renderThermalReceipt(
  bill: BillData,
  result: BillCalculationResult
): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const scale = 2; // Retina sharpness
  const width = 640;

  // Calculate dynamic content height
  const baseHeaderHeight = 220;
  const itemsHeight = bill.items.length * 36;
  const chargesHeight = 110;
  const participantsHeight = result.participants.length * 34 + 60;
  const footerHeight = 180;
  const calculatedHeight =
    baseHeaderHeight + itemsHeight + chargesHeight + participantsHeight + footerHeight;

  canvas.width = width * scale;
  canvas.height = calculatedHeight * scale;
  ctx.scale(scale, scale);

  // Background - Off-white soft thermal paper tone
  const paperColor = "#faf9f6";
  ctx.fillStyle = paperColor;

  // Draw jagged paper top & bottom
  const toothW = 16;
  const toothH = 8;
  const numTeeth = Math.ceil(width / toothW);

  ctx.beginPath();
  // Top jagged edge
  ctx.moveTo(0, toothH);
  for (let i = 0; i < numTeeth; i++) {
    const x = i * toothW;
    ctx.lineTo(x + toothW / 2, 0);
    ctx.lineTo(x + toothW, toothH);
  }
  // Right edge down
  ctx.lineTo(width, calculatedHeight - toothH);
  // Bottom jagged edge
  for (let i = numTeeth - 1; i >= 0; i--) {
    const x = i * toothW;
    ctx.lineTo(x + toothW / 2, calculatedHeight);
    ctx.lineTo(x, calculatedHeight - toothH);
  }
  // Left edge up
  ctx.lineTo(0, toothH);
  ctx.closePath();
  ctx.fill();

  // Subtle paper inner shadow border
  ctx.strokeStyle = "#e8e5dc";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Text Styling Setup
  const monoFont = "Courier New, monospace";
  ctx.fillStyle = "#1e293b"; // dark charcoal ink
  ctx.textBaseline = "top";

  let y = 35;

  // 1. Header: Store Name
  ctx.font = `bold 22px ${monoFont}`;
  ctx.textAlign = "center";
  ctx.fillText(bill.title.toUpperCase(), width / 2, y);
  y += 30;

  ctx.font = `13px ${monoFont}`;
  ctx.fillStyle = "#64748b";
  ctx.fillText(`TANGGAL: ${bill.date} • ${result.participants.length} ORANG`, width / 2, y);
  y += 20;

  ctx.fillText("========================================", width / 2, y);
  y += 24;

  // 2. Column Headers
  ctx.font = `bold 12px ${monoFont}`;
  ctx.fillStyle = "#334155";
  ctx.textAlign = "left";
  ctx.fillText("MENU PESANAN", 36, y);
  ctx.textAlign = "right";
  ctx.fillText("HARGA", width - 36, y);
  y += 18;

  ctx.textAlign = "center";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("----------------------------------------", width / 2, y);
  y += 18;

  // 3. Items List
  ctx.font = `13px ${monoFont}`;
  bill.items.forEach((item) => {
    ctx.fillStyle = "#1e293b";
    ctx.textAlign = "left";
    const nameStr = `${item.quantity > 1 ? `${item.quantity}x ` : ""}${item.name}`;
    const truncated = nameStr.length > 26 ? nameStr.substring(0, 24) + ".." : nameStr;
    ctx.fillText(truncated, 36, y);

    ctx.textAlign = "right";
    ctx.fillText(formatCurrency(item.totalPrice, bill.currency), width - 36, y);
    y += 26;
  });

  // 4. Divider
  y += 6;
  ctx.textAlign = "center";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("----------------------------------------", width / 2, y);
  y += 18;

  // 5. Charges / Subtotal / Tax / Total
  ctx.textAlign = "left";
  ctx.fillStyle = "#475569";
  ctx.font = `13px ${monoFont}`;
  ctx.fillText("SUBTOTAL", 36, y);
  ctx.textAlign = "right";
  ctx.fillText(formatCurrency(result.subtotal, bill.currency), width - 36, y);
  y += 22;

  if (result.discountAmount > 0) {
    ctx.textAlign = "left";
    ctx.fillText("DISKON", 36, y);
    ctx.textAlign = "right";
    ctx.fillText(`-${formatCurrency(result.discountAmount, bill.currency)}`, width - 36, y);
    y += 22;
  }

  if (result.taxAmount > 0 || result.serviceChargeAmount > 0) {
    ctx.textAlign = "left";
    ctx.fillText("PAJAK & SERVICE", 36, y);
    ctx.textAlign = "right";
    ctx.fillText(
      `+${formatCurrency(result.taxAmount + result.serviceChargeAmount, bill.currency)}`,
      width - 36,
      y
    );
    y += 22;
  }

  // Grand Total
  y += 4;
  ctx.font = `bold 16px ${monoFont}`;
  ctx.fillStyle = "#0f172a";
  ctx.textAlign = "left";
  ctx.fillText("TOTAL TAGIHAN", 36, y);
  ctx.textAlign = "right";
  ctx.fillText(formatCurrency(result.finalGrandTotal, bill.currency), width - 36, y);
  y += 26;

  ctx.textAlign = "center";
  ctx.fillStyle = "#64748b";
  ctx.fillText("========================================", width / 2, y);
  y += 22;

  // 6. Participants Section
  ctx.font = `bold 12px ${monoFont}`;
  ctx.fillStyle = "#334155";
  ctx.textAlign = "left";
  ctx.fillText("RINCIAN PEMBAYARAN PER ORANG:", 36, y);
  y += 20;

  ctx.font = `13px ${monoFont}`;
  result.participants.forEach((p) => {
    ctx.textAlign = "left";
    ctx.fillStyle = p.paymentStatus === "paid" ? "#047857" : "#0f172a";
    const statusText = p.paymentStatus === "paid" ? "[LUNAS]" : "[BELUM]";
    ctx.fillText(`• ${p.name} ${statusText}`, 36, y);

    ctx.textAlign = "right";
    ctx.fillText(formatCurrency(p.finalTotal, bill.currency), width - 36, y);
    y += 24;
  });

  // 7. Footer & Barcode
  y += 12;
  ctx.textAlign = "center";
  ctx.fillStyle = "#64748b";
  ctx.fillText("========================================", width / 2, y);
  y += 20;

  ctx.font = `italic 12px ${monoFont}`;
  ctx.fillStyle = "#475569";
  ctx.fillText("TERIMA KASIH TELAH BERBAGI!", width / 2, y);
  y += 18;
  ctx.font = `11px ${monoFont}`;
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Dihitung otomatis dengan Smart Bill Splitter ⚡", width / 2, y);
  y += 24;

  // Draw simulated barcode
  const barcodeX = width / 2 - 120;
  const barcodeW = 240;
  const barcodeH = 34;

  ctx.fillStyle = "#1e293b";
  // Draw barcode strips
  for (let bx = 0; bx < barcodeW; bx += 3) {
    const isBar = (bx * 7 + 13) % 9 !== 0;
    if (isBar) {
      const thickness = (bx % 5 === 0) ? 2.5 : 1.2;
      ctx.fillRect(barcodeX + bx, y, thickness, barcodeH);
    }
  }

  return canvas.toDataURL("image/png");
}

/**
 * Renders Modern Glassmorphic Dark Card suitable for Instagram Story / WhatsApp.
 */
function renderModernCard(
  bill: BillData,
  result: BillCalculationResult
): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const scale = 2;
  const width = 640;

  const baseHeight = 220;
  const itemsHeight = bill.items.length * 36;
  const participantsHeight = result.participants.length * 40 + 80;
  const calculatedHeight = baseHeight + itemsHeight + participantsHeight + 140;

  canvas.width = width * scale;
  canvas.height = calculatedHeight * scale;
  ctx.scale(scale, scale);

  // Background Gradient - Deep modern slate/emerald
  const grad = ctx.createLinearGradient(0, 0, width, calculatedHeight);
  grad.addColorStop(0, "#090d16");
  grad.addColorStop(0.5, "#0f172a");
  grad.addColorStop(1, "#03282c");
  ctx.fillStyle = grad;

  // Rounded outer box
  roundRect(ctx, 16, 16, width - 32, calculatedHeight - 32, 28);
  ctx.fill();

  // Subtle glowing border
  ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  let y = 45;
  const sansFont = "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif";

  // App Title / Badge
  ctx.textAlign = "center";
  ctx.font = `bold 11px ${sansFont}`;
  ctx.fillStyle = "#38bdf8"; // sky-400
  ctx.fillText("SMART BILL & RECEIPT SPLITTER", width / 2, y);
  y += 24;

  // Bill Title
  ctx.font = `900 24px ${sansFont}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(bill.title, width / 2, y);
  y += 24;

  ctx.font = `500 12px ${sansFont}`;
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`${bill.date} • ${result.participants.length} Orang`, width / 2, y);
  y += 30;

  // Grand Total Card Box
  const boxX = 42;
  const boxW = width - 84;
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  roundRect(ctx, boxX, y, boxW, 76, 20);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.font = `600 11px ${sansFont}`;
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("TOTAL TAGIHAN", width / 2, y + 16);

  ctx.font = `900 28px ${sansFont}`;
  ctx.fillStyle = "#34d399"; // emerald-400
  ctx.fillText(formatCurrency(result.finalGrandTotal, bill.currency), width / 2, y + 42);
  y += 100;

  // Participants Breakdown
  ctx.textAlign = "left";
  ctx.font = `bold 13px ${sansFont}`;
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText("RINCIAN PER PESERTA", 44, y);
  y += 24;

  result.participants.forEach((p) => {
    const isPaid = p.paymentStatus === "paid";
    ctx.fillStyle = isPaid ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.04)";
    roundRect(ctx, 42, y, boxW, 36, 12);
    ctx.fill();

    ctx.textAlign = "left";
    ctx.font = `bold 13px ${sansFont}`;
    ctx.fillStyle = isPaid ? "#6ee7b7" : "#f1f5f9";
    ctx.fillText(p.name, 56, y + 12);

    ctx.textAlign = "right";
    ctx.font = `bold 13px ${sansFont}`;
    ctx.fillText(formatCurrency(p.finalTotal, bill.currency), width - 56, y + 12);
    y += 42;
  });

  // Footer branding
  y += 20;
  ctx.textAlign = "center";
  ctx.font = `500 11px ${sansFont}`;
  ctx.fillStyle = "#64748b";
  ctx.fillText("Dihitung cepat & adil dengan Smart Bill Splitter ⚡", width / 2, y);

  return canvas.toDataURL("image/png");
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
