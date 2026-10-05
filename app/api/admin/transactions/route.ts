import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin/auth";
import { getAllTransactions } from "@/lib/server/transaction-store";

export async function GET(req: NextRequest) {
  const isAuth = verifyAdminRequest(req);
  if (!isAuth) {
    return NextResponse.json(
      { error: "Akses ditolak. Silakan login sebagai admin." },
      { status: 401 }
    );
  }

  const transactions = getAllTransactions();

  // Compute key summary statistics for the admin dashboard
  const totalTransactions = transactions.length;
  const totalVolume = transactions.reduce((acc, tx) => acc + (tx.grandTotal || 0), 0);
  const totalParticipants = transactions.reduce((acc, tx) => acc + (tx.participantCount || 0), 0);
  const fullyPaidCount = transactions.filter((tx) => tx.status === "paid").length;
  const partialPaidCount = transactions.filter((tx) => tx.status === "partial").length;
  const pendingCount = transactions.filter((tx) => tx.status === "pending").length;
  const scanCount = transactions.filter((tx) => tx.source === "scan").length;
  const manualCount = transactions.filter((tx) => tx.source === "manual").length;
  const avgTicket = totalTransactions > 0 ? Math.round(totalVolume / totalTransactions) : 0;

  return NextResponse.json({
    success: true,
    stats: {
      totalTransactions,
      totalVolume,
      totalParticipants,
      fullyPaidCount,
      partialPaidCount,
      pendingCount,
      scanCount,
      manualCount,
      avgTicket,
    },
    transactions,
  });
}
