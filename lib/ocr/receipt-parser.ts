export interface ParsedReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ParsedReceiptData {
  storeName?: string;
  items: ParsedReceiptItem[];
  subtotal: number;
  tax: number;
  service: number;
  discount: number;
  total: number;
  isTotalMatching: boolean;
  discrepancy: number;
  rawText?: string;
  isReceipt: boolean;
  error?: string;
}

/**
 * Intelligent Multi-format Receipt Parser.
 * Accurately handles:
 * 1. Multi-line receipts with packaging units (e.g. "1 lusin x 36.000", "1 500 ml x 7,000", "2 porsi x 25.000")
 * 2. Trailing and multiplier quantities on single lines (e.g. "Martabak Original x2 40,000", "Martabak Original 2x 40.000")
 * 3. Numbered items (e.g. "1. Indomie Goreng", "2. Fruit Tea Apple")
 * 4. Comma / dot decimal & thousands separators (e.g. "7,000", "36.000")
 * 5. Filters out summary noise like "TOTAL QTY: 14", "Bayar (Cash)", etc.
 */
export function parseReceiptText(rawText: string): ParsedReceiptData {
  if (!rawText || rawText.trim().length < 5) {
    return {
      items: [],
      subtotal: 0,
      tax: 0,
      service: 0,
      discount: 0,
      total: 0,
      isTotalMatching: false,
      discrepancy: 0,
      rawText: rawText || "",
      isReceipt: false,
      error: "Teks pada foto terlalu sedikit atau tidak terbaca.",
    };
  }

  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const items: ParsedReceiptItem[] = [];
  let subtotal = 0;
  let tax = 0;
  let service = 0;
  let discount = 0;
  let grandTotal = 0;
  let storeName = "";
  let pendingName = "";

  // Helper to parse price string e.g. "Rp 36.000", "7,000", "27,000.00"
  const parsePrice = (str: string): number => {
    let cleaned = str.replace(/[Rr][Pp]\.?\s*/gi, "").trim();
    // Drop date patterns like 18.7.2024 or 18/07/2024
    if (/^\d{1,4}[./-]\d{1,2}[./-]\d{2,4}$/.test(cleaned)) {
      return 0;
    }
    // Drop decimal cents if ending in ,00 or .00
    if (/[,.]\d{2}$/.test(cleaned)) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.replace(/[^\d]/g, "");
    return parseInt(cleaned, 10) || 0;
  };

  const cleanItemName = (name: string): string => {
    return name
      .replace(/^\s*\d+[\.\)\-]\s*/, "") // Remove leading "1. ", "2. ", "3) "
      .replace(/[Rr][Pp]\.?/gi, "")
      .replace(/^[-*•|#.,\s]+/, "")
      .replace(/[-*•|#.,\s]+$/, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  const taxRegex = /(pajak|tax|pb1|ppn|service\s*tax)/i;
  const serviceRegex = /(service\s*charge|service|layanan|servis)/i;
  const discountRegex = /(diskon|discount|promo|potongan|voucher|hemat)/i;
  const subtotalRegex = /(subtotal|sub\s*total|sub-total|harga\s*jual)/i;
  const totalQtyRegex = /(total\s*qty|total\s*item|total\s*barang|jumlah\s*item|qty\s*total)/i;
  const totalRegex = /(grand\s*total|total\s*bayar|^total\b|tagihan|amount\s*due|net\s*total)/i;
  const paymentRegex = /(bayar|cash|kembali|change|tunai|debit|qris|kartu|card|terima\s*kasih|thank\s*you|lunas)/i;
  const metaRegex = /(tanggal|date|waktu|time|kasir|cashier|table|meja|antrian|queue|no\.|invoice|order|customer|pelanggan|telp|phone|kode\s*struk)/i;
  const addressRegex = /(?:^|\s)(?:jl\.?|jalan|komplek|ruko|blok|gedung|lantai|lt\.?|kec\.?|kel\.?|kab\.?|kota)(?:\s|$)/i;
  const phoneRegex = /\b(08\d{8,12}|\+?62\d{8,12})\b/;
  const dateTimeOrReceiptNumRegex = /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b|\b\d{1,2}:\d{2}(?::\d{2})?\b|#\d+/;
  const storePolicyRegex = /(belanja\s*puas|harga\s*pas|barang\s*yang\s*sudah\s*dibeli|tidak\s*(?:bisa|dapat)\s*dikembalikan|dikembalikan\s*lagi|simpan\s*struk|kunjungi|kritik|saran|call\s*center|sms)/i;
  const dividerRegex = /^[-=_*~.#]{3,}$/;
  const unitsRegex = /\b(lusin|lsn|doz|dozen|pcs|pc|bh|buah|biji|bj|porsi|prs|paket|pkt|pack|pck|dus|box|btl|botol|kaleng|can|cup|gelas|piring|bowl|kg|gr|gram|g|ons|mg|ml|ltr?|liter)\b/gi;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Skip divider lines
    if (dividerRegex.test(line)) {
      continue;
    }

    // Skip total quantity line e.g. "Total QTY : 14"
    if (totalQtyRegex.test(lower)) {
      pendingName = "";
      continue;
    }

    // Detect Summary lines
    if (discountRegex.test(lower)) {
      const match = line.match(/(\d[\d.,]*)/g);
      if (match) discount = parsePrice(match[match.length - 1]);
      pendingName = "";
      continue;
    }

    if (serviceRegex.test(lower) && !taxRegex.test(lower)) {
      const match = line.match(/(\d[\d.,]*)/g);
      if (match) service = parsePrice(match[match.length - 1]);
      pendingName = "";
      continue;
    }

    if (taxRegex.test(lower)) {
      const match = line.match(/(\d[\d.,]*)/g);
      if (match) tax = parsePrice(match[match.length - 1]);
      pendingName = "";
      continue;
    }

    if (subtotalRegex.test(lower) && !totalRegex.test(lower)) {
      const match = line.match(/(\d[\d.,]*)/g);
      if (match) subtotal = parsePrice(match[match.length - 1]);
      pendingName = "";
      continue;
    }

    if (totalRegex.test(lower)) {
      const match = line.match(/(\d[\d.,]*)/g);
      if (match) grandTotal = parsePrice(match[match.length - 1]);
      pendingName = "";
      continue;
    }

    if (
      paymentRegex.test(lower) ||
      metaRegex.test(lower) ||
      addressRegex.test(line) ||
      phoneRegex.test(line) ||
      dateTimeOrReceiptNumRegex.test(line) ||
      storePolicyRegex.test(lower) ||
      line.includes("http") ||
      line.includes(".com")
    ) {
      pendingName = "";
      continue;
    }

    // Capture Store Name from top lines
    if (
      i < 3 &&
      !storeName &&
      line.length > 2 &&
      !line.match(/\d{4,}/) &&
      !metaRegex.test(lower) &&
      !addressRegex.test(line) &&
      !storePolicyRegex.test(lower)
    ) {
      storeName = line;
      continue;
    }

    // -------------------------------------------------------------
    // Pattern 1: Pricing Line with Units (e.g. "1 lusin x 36.000 Rp 36.000", "1 500 ml x 7,000 Rp 7.000")
    // -------------------------------------------------------------
    const textWithoutPricesOrUnits = line
      .replace(/[Rr][Pp]\.?/gi, "")
      .replace(/(\d[\d.,]*)/g, "")
      .replace(unitsRegex, "")
      .replace(/[xX*@\/]/g, "")
      .replace(/[-*•|#.,\s:]+/g, "")
      .trim();

    const isPurePricingLine = textWithoutPricesOrUnits.length <= 1;

    if (isPurePricingLine) {
      const nums = line.match(/(\d[\d.,]*)/g);
      if (nums && nums.length > 0 && pendingName) {
        let qty = 1;
        let unitPrice = 0;
        let totalPrice = 0;

        // Extract leading quantity e.g. "1 lusin x", "2 x"
        const qtyMatch = line.match(/^\s*(\d{1,3})\s*(?:[a-zA-Z]+\s*)?[xX*@]/);
        if (qtyMatch) {
          qty = parseInt(qtyMatch[1], 10);
        }

        const validPrices = nums
          .map((n) => parsePrice(n))
          .filter((p) => p >= 500 && p <= 5000000);

        if (validPrices.length >= 2) {
          unitPrice = validPrices[validPrices.length - 2];
          totalPrice = validPrices[validPrices.length - 1];
        } else if (validPrices.length === 1) {
          totalPrice = validPrices[0];
          unitPrice = Math.round(totalPrice / qty);
        }

        if (totalPrice >= 500) {
          items.push({
            id: `item_rec_${Date.now()}_${items.length}`,
            name: cleanItemName(pendingName),
            quantity: Math.max(1, qty),
            unitPrice: unitPrice || totalPrice,
            totalPrice: totalPrice,
          });
          pendingName = "";
          continue;
        }
      }
    }

    // -------------------------------------------------------------
    // Pattern 2: Single Line Item
    // Handles:
    // "Martabak Original      x2    40,000"
    // "Es Teh Manis           x1     4,000"
    // "Martabak Telur         2x    33,000"
    // "Martabak Original 2 x 20.000 40.000"
    // "2x Ayam Kremes 30.000"
    // -------------------------------------------------------------
    const numbers = line.match(/(\d[\d.,]*)/g);
    if (numbers && numbers.length > 0) {
      const lastNum = numbers[numbers.length - 1];
      const parsedPrice = parsePrice(lastNum);

      // Ignore bare calendar years (e.g. 2024, 2025, 2026) that lack currency dots or Rp
      const isYear = !lastNum.includes(".") && !lastNum.includes(",") && !/[Rr][Pp]/i.test(line) && parsedPrice >= 1990 && parsedPrice <= 2040;

      if (!isYear && parsedPrice >= 500 && parsedPrice <= 5000000) {
        let namePart = line.slice(0, line.lastIndexOf(lastNum)).trim();
        let qty = 1;
        let unitPrice = 0;

        // Check 2a: Middle pricing like "2 x 20.000" before the last total price
        const midPricingMatch = namePart.match(/(?:[\s\t]+|^)(\d{1,3})\s*(?:[a-zA-Z]+\s*)?[xX*@]\s*(\d[\d.,]*)\s*$/);
        if (midPricingMatch) {
          qty = parseInt(midPricingMatch[1], 10) || 1;
          unitPrice = parsePrice(midPricingMatch[2]);
          namePart = namePart.slice(0, midPricingMatch.index).trim();
        } else {
          // Check 2b: Trailing multiplier like "x2", "2x", "x 2", "x1"
          const trailingQtyMatch = namePart.match(/(?:[\s\t]+|^)([xX*@]?)\s*(\d{1,3})\s*([xX*@]?)(?:\s*(?:pcs|pc|porsi|prs|buah|bh|biji|bj|pack|cup|btl|lusin))?\s*$/i);
          if (
            trailingQtyMatch &&
            (trailingQtyMatch[1] || trailingQtyMatch[3] || /[xX*@]/i.test(trailingQtyMatch[0]))
          ) {
            qty = parseInt(trailingQtyMatch[2], 10) || 1;
            namePart = namePart.slice(0, trailingQtyMatch.index).trim();
          } else {
            // Check 2c: Leading multiplier like "2x Martabak" or "2 Martabak"
            const leadingQtyMatch = namePart.match(/^(\d{1,3})\s*([xX*@]?)\s+/);
            if (leadingQtyMatch && (leadingQtyMatch[2] || leadingQtyMatch[1].length <= 2)) {
              qty = parseInt(leadingQtyMatch[1], 10);
              namePart = namePart.slice(leadingQtyMatch[0].length).trim();
            }
          }
        }

        namePart = cleanItemName(namePart);

        const hasLetters = /[a-zA-Z]{2,}/.test(namePart);
        if (hasLetters && namePart.length >= 2) {
          if (!unitPrice) {
            unitPrice = Math.round(parsedPrice / Math.max(1, qty));
          }

          items.push({
            id: `item_rec_${Date.now()}_${items.length}`,
            name: namePart,
            quantity: Math.max(1, qty),
            unitPrice: unitPrice,
            totalPrice: parsedPrice,
          });
          pendingName = "";
          continue;
        }
      }
    }

    // -------------------------------------------------------------
    // Candidate Item Name on its own line
    // -------------------------------------------------------------
    const hasLetters = /[a-zA-Z]{2,}/.test(line);
    const cleanedText = cleanItemName(line);
    if (hasLetters && cleanedText.length >= 2 && !paymentRegex.test(lower)) {
      pendingName = line;
    }
  }

  // Verification whether this is an actual receipt
  const isReceipt = items.length > 0 || grandTotal > 0 || subtotal > 0;

  if (!isReceipt) {
    return {
      storeName,
      items: [],
      subtotal: 0,
      tax: 0,
      service: 0,
      discount: 0,
      total: 0,
      isTotalMatching: false,
      discrepancy: 0,
      rawText,
      isReceipt: false,
      error: "Foto tidak terdeteksi sebagai struk restoran atau kasir. Pastikan foto memperlihatkan nama menu dan harga dengan jelas.",
    };
  }

  const itemsTotal = items.reduce((acc, it) => acc + it.totalPrice, 0);
  if (subtotal === 0) {
    subtotal = itemsTotal;
  }

  const expectedTotal = subtotal - discount + service + tax;
  if (grandTotal === 0) {
    grandTotal = expectedTotal;
  }

  const discrepancy = expectedTotal - grandTotal;
  const isTotalMatching = Math.abs(discrepancy) <= 1;

  return {
    storeName: storeName || "Struk Pembayaran",
    items,
    subtotal,
    tax,
    service,
    discount,
    total: grandTotal,
    isTotalMatching,
    discrepancy,
    rawText,
    isReceipt: true,
  };
}
