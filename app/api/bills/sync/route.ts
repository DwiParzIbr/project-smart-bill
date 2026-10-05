import { NextRequest, NextResponse } from "next/server";
import { upsertTransactionFromBill } from "@/lib/server/transaction-store";
import { BillData, BillCalculationResult } from "@/lib/types/bill";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

    // Support single bill sync or batch bills sync
    if (body.bills && Array.isArray(body.bills)) {
      const records = body.bills.map((item: { bill: BillData; result?: BillCalculationResult }) =>
        upsertTransactionFromBill(item.bill, item.result, clientIp)
      );
      return NextResponse.json({
        success: true,
        count: records.length,
      });
    }

    if (body.bill) {
      const record = upsertTransactionFromBill(body.bill, body.result, clientIp);
      return NextResponse.json({
        success: true,
        record,
      });
    }

    return NextResponse.json(
      { error: "Format payload tidak valid. Membutuhkan object 'bill' atau array 'bills'." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Error syncing bill:", err);
    return NextResponse.json(
      { error: "Gagal menyinkronkan transaksi ke server." },
      { status: 500 }
    );
  }
}
