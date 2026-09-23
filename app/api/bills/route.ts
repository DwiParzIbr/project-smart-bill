import { NextRequest, NextResponse } from "next/server";
import { calculateBill } from "@/lib/calculation/engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bill, charges } = body;

    if (!bill || !bill.items || !bill.participants) {
      return NextResponse.json(
        { error: "Invalid bill payload" },
        { status: 400 }
      );
    }

    // Always recompute calculations on the server for security (Section 31)
    const calculation = calculateBill(
      bill.participants,
      bill.items,
      charges || bill.charges
    );

    return NextResponse.json({
      success: true,
      calculation,
      serverTimestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Server calculation error" },
      { status: 500 }
    );
  }
}
