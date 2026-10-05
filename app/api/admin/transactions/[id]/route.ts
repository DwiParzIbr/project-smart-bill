import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin/auth";
import { getTransactionById, deleteTransaction } from "@/lib/server/transaction-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = verifyAdminRequest(req);
  if (!isAuth) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  }

  const { id } = await params;
  const transaction = getTransactionById(id);
  if (!transaction) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ success: true, transaction });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = verifyAdminRequest(req);
  if (!isAuth) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  }

  const { id } = await params;
  const success = deleteTransaction(id);
  if (!success) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Transaksi berhasil dihapus." });
}
