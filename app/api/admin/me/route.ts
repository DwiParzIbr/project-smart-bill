import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin/auth";

export async function GET(req: NextRequest) {
  const isAuth = verifyAdminRequest(req);
  if (!isAuth) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: "admin",
  });
}
