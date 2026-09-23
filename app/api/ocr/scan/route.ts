import { NextRequest, NextResponse } from "next/server";
import { parseReceiptText } from "@/lib/ocr/receipt-parser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as Blob | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    const clientKey = req.headers.get("x-gemini-key");
    const apiKey = clientKey || process.env.GEMINI_API_KEY;

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    if (apiKey) {
      // Call Google Gemini Vision API
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

      const preferredModel = req.headers.get("x-gemini-model");
      const allModels = [
        "gemini-3.5-flash-lite", // 1. 3.5 Flash-Lite (Jawaban tercepat)
        "gemini-3.6-flash",      // 2. 3.6 Flash (Bantuan serbaguna standar)
        "gemini-3.8-flash",      // 3. 3.8 Flash (Bantuan serbaguna edisi baru / berbayar)
        "gemini-3.1-pro",        // 4. 3.1 Pro (Penalaran yang canggih)
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
                          mime_type: mimeType,
                          data: base64Image,
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
          // try next
        }
      }

      if (response && response.ok) {
        const data = await response.json();
        const textContent =
          data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        try {
          const parsedGemini = JSON.parse(textContent);

          if (!parsedGemini.isReceipt) {
            return NextResponse.json({
              success: false,
              parsed: {
                isReceipt: false,
                items: [],
                subtotal: 0,
                tax: 0,
                service: 0,
                discount: 0,
                total: 0,
                isTotalMatching: false,
                discrepancy: 0,
                error:
                  parsedGemini.error ||
                  "Foto yang diunggah bukan struk belanja atau restoran.",
              },
            });
          }

          // Add unique IDs to items
          const itemsWithIds = (parsedGemini.items || []).map(
            (it: any, idx: number) => ({
              id: `item_gemini_${Date.now()}_${idx}`,
              name: it.name || `Menu ${idx + 1}`,
              quantity: Math.max(1, Number(it.quantity) || 1),
              unitPrice: Math.round(Number(it.unitPrice) || 0),
              totalPrice: Math.round(Number(it.totalPrice) || 0),
            })
          );

          const subtotal = Math.round(Number(parsedGemini.subtotal) || 0);
          const tax = Math.round(Number(parsedGemini.tax) || 0);
          const service = Math.round(Number(parsedGemini.service) || 0);
          const discount = Math.round(Number(parsedGemini.discount) || 0);
          const total = Math.round(Number(parsedGemini.total) || 0);

          const expected = subtotal - discount + service + tax;

          return NextResponse.json({
            success: true,
            parsed: {
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
            },
          });
        } catch (parseErr) {
          console.error("Failed to parse Gemini response JSON:", textContent);
        }
      } else if (response) {
        const errDetail = await response.text();
        console.error("Gemini API error status:", response.status, errDetail);
      } else {
        console.error("All Gemini API candidate models failed or returned non-200");
      }
    }

    // Fallback if no API key or API call failed:
    // Return informative response to client
    return NextResponse.json({
      success: false,
      message: "No AI API key configured on server. Falling back to client OCR.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process receipt" },
      { status: 500 }
    );
  }
}
