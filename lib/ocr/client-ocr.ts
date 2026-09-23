import { ParsedReceiptData, parseReceiptText } from "./receipt-parser";

/**
 * Preprocesses an image via HTML5 Canvas (grayscale & contrast enhancement)
 * for optimal OCR character recognition on phone photos of receipts.
 */
async function preprocessImageToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Cannot get canvas context"));
        return;
      }

      // Max dimension 1200px for speed, clarity, and mobile memory safety
      const maxDim = 1200;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw original
      ctx.drawImage(img, 0, 0, width, height);

      // Grayscale & Contrast enhancement
      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          // Luminosity formula
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // Simple contrast boost
          const factor = 1.25;
          const adjusted = Math.min(255, Math.max(0, factor * (gray - 128) + 128));

          data[i] = adjusted;
          data[i + 1] = adjusted;
          data[i + 2] = adjusted;
        }
        ctx.putImageData(imgData, 0, 0);
      } catch {
        // Fallback without pixel manipulation if tainted
      }

      URL.revokeObjectURL(img.src);
      resolve(canvas);
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(img.src);
      reject(e);
    };
    img.src = URL.createObjectURL(file);
  });
}

async function callGeminiDirectly(
  file: File,
  apiKey: string,
  preferredModel?: string | null
): Promise<ParsedReceiptData | null> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const data = res.split(",")[1];
      resolve(data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const prompt = `Analyze this image carefully.
CRITICAL INSTRUCTIONS:
1. Determine if this image is a restaurant receipt, store receipt, supermarket/minimarket receipt (such as Alfamart, Indomaret, etc.), retail invoice, or food bill.
2. Even if the receipt is held by hand/fingers, photographed on a table, or has background items like a payment terminal (EDC machine), desk, or card reader, as long as receipt text and prices are visible, it IS a valid receipt.
3. Only reject (isReceipt: false) if it is completely NOT a receipt (for example: photo of people only, graduation, ceremony, landscape, selfie, or random object with no purchase prices). If rejected:
{
  "isReceipt": false,
  "error": "Foto yang diunggah tidak terdeteksi sebagai struk belanja/restoran."
}

4. If it IS a receipt, extract all items and charges as Indonesian Rupiah integers:
{
  "isReceipt": true,
  "storeName": "Name of restaurant/store",
  "items": [
    {
      "name": "Item name",
      "quantity": 1,
      "unitPrice": 25000,
      "totalPrice": 25000
    }
  ],
  "subtotal": 25000,
  "tax": 2500,
  "service": 0,
  "discount": 0,
  "total": 27500
}
Return ONLY valid JSON. No markdown backticks.`;

  // Exact model hierarchy as requested:
  // 1. 3.5 Flash-Lite (Jawaban tercepat)
  // 2. 3.6 Flash (Bantuan serbaguna standar)
  // 3. 3.8 Flash (Bantuan serbaguna edisi baru / berbayar)
  // 4. 3.1 Pro (Penalaran yang canggih)
  const allModels = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.8-flash",
    "gemini-3.1-pro",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
  ];

  const candidateModels =
    preferredModel && preferredModel !== "auto"
      ? [preferredModel, ...allModels.filter((m) => m !== preferredModel)]
      : allModels;

  let response: Response | null = null;

  for (const model of candidateModels) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: file.type || "image/jpeg",
                      data: base64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: "application/json",
            },
          }),
        }
      );

      if (res.ok) {
        response = res;
        break;
      }
    } catch {
      // try next model
    }
  }

  if (!response || !response.ok) {
    console.warn("Direct Gemini Vision API models exhausted or failed");
    return null;
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const parsedGemini = JSON.parse(textContent);

  if (!parsedGemini.isReceipt) {
    return {
      isReceipt: false,
      items: [],
      subtotal: 0,
      tax: 0,
      service: 0,
      discount: 0,
      total: 0,
      isTotalMatching: false,
      discrepancy: 0,
      error: parsedGemini.error || "Foto yang diunggah bukan struk belanja atau restoran.",
    };
  }

  const itemsWithIds = (parsedGemini.items || []).map((it: any, idx: number) => ({
    id: `item_gemini_${Date.now()}_${idx}`,
    name: it.name || `Menu ${idx + 1}`,
    quantity: Math.max(1, Number(it.quantity) || 1),
    unitPrice: Math.round(Number(it.unitPrice) || 0),
    totalPrice: Math.round(Number(it.totalPrice) || 0),
  }));

  const subtotal = Math.round(Number(parsedGemini.subtotal) || 0);
  const tax = Math.round(Number(parsedGemini.tax) || 0);
  const service = Math.round(Number(parsedGemini.service) || 0);
  const discount = Math.round(Number(parsedGemini.discount) || 0);
  const total = Math.round(Number(parsedGemini.total) || 0);
  const expected = subtotal - discount + service + tax;

  return {
    storeName: parsedGemini.storeName || "Struk Pembayaran",
    items: itemsWithIds,
    subtotal,
    tax,
    service,
    discount,
    total: total || expected,
    isTotalMatching: Math.abs(expected - total) <= 1,
    discrepancy: expected - total,
    isReceipt: true,
  };
}

/**
 * Executes OCR on an image file using either AI Vision (if Gemini key provided)
 * or real browser Tesseract OCR engine.
 */
export async function performReceiptOCR(
  file: File,
  geminiKey?: string | null,
  onProgress?: (progressText: string) => void,
  preferredModel?: string | null
): Promise<ParsedReceiptData> {
  // Option 1: AI Vision via Gemini API
  if (geminiKey) {
    if (onProgress) onProgress("Menganalisis struk dengan Google Gemini Vision...");

    // Try server relay first
    try {
      const formData = new FormData();
      formData.append("image", file);

      const headers: Record<string, string> = {
        "x-gemini-key": geminiKey,
      };
      if (preferredModel) {
        headers["x-gemini-model"] = preferredModel;
      }

      const res = await fetch("/api/ocr/scan", {
        method: "POST",
        headers,
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.parsed) {
          return json.parsed;
        }
      }
    } catch {
      // Continue to direct client call if server relay fails
    }

    // Direct client-side Gemini Vision call (works directly from browser/phone internet)
    try {
      if (onProgress) onProgress("Menghubungkan langsung ke Google Gemini AI...");
      const directResult = await callGeminiDirectly(file, geminiKey, preferredModel);
      if (directResult) {
        return directResult;
      }
    } catch (directErr) {
      console.warn("Direct client Gemini OCR failed:", directErr);
    }
  }

  // Option 2: Browser Client-side Tesseract.js OCR
  if (onProgress) onProgress("Menyiapkan pemindai teks struk...");

  try {
    const canvas = await preprocessImageToCanvas(file);

    if (onProgress) onProgress("Mempersiapkan mesin baca teks...");

    let activeWorker: any = null;

    const workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      activeWorker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "loading tesseract core") {
            onProgress?.("Memuat modul pengenal teks...");
          } else if (m.status === "loading language traineddata") {
            const pct = Math.round((m.progress || 0) * 100);
            onProgress?.(`Mengunduh modul bahasa (${pct}%)...`);
          } else if (m.status === "recognizing text") {
            const pct = Math.round((m.progress || 0) * 100);
            onProgress?.(`Mengenali tulisan struk (${pct}%)...`);
          }
        },
      });

      const ret = await activeWorker.recognize(canvas);
      await activeWorker.terminate();
      activeWorker = null;
      return ret.data?.text || "";
    })();

    // 25 second timeout safeguard so mobile never hangs permanently
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        if (activeWorker) {
          activeWorker.terminate().catch(() => {});
        }
        reject(new Error("OCR_TIMEOUT"));
      }, 25000);
    });

    const text = await Promise.race([workerPromise, timeoutPromise]);

    if (onProgress) onProgress("Menyusun rincian menu dan harga...");

    const parsed = parseReceiptText(text);
    return parsed;
  } catch (err: any) {
    console.error("Client OCR failed:", err);
    const isTimeout = err?.message === "OCR_TIMEOUT";
    return {
      items: [],
      subtotal: 0,
      tax: 0,
      service: 0,
      discount: 0,
      total: 0,
      isTotalMatching: false,
      discrepancy: 0,
      isReceipt: false,
      error: isTimeout
        ? "Waktu pemindaian OCR habis karena koneksi lambat. Gunakan foto yang lebih dekat atau masukkan menu secara manual."
        : "Gagal memproses gambar. Pastikan format foto didukung atau masukkan menu secara manual.",
    };
  }
}
