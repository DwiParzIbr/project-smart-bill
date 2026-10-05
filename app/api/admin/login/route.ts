import { NextRequest, NextResponse } from "next/server";
import {
  validateAdminCredentials,
  generateAdminToken,
  ADMIN_COOKIE_NAME,
} from "@/lib/admin/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const isValid = validateAdminCredentials(username, password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Username atau password admin salah." },
        { status: 401 }
      );
    }

    const token = generateAdminToken(username);
    const response = NextResponse.json({
      success: true,
      message: "Login admin berhasil.",
      username,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat memproses login." },
      { status: 500 }
    );
  }
}
