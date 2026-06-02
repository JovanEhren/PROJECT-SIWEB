import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { pool } from "@/lib/db";
import { findAdminByLogin } from "@/lib/server/admin-auth";

function hasDigit(value: string) {
  return /\d/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const login = String(body.login || "").trim();
    const newPassword = String(body.newPassword || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!login) {
      return NextResponse.json(
        { field: "login", message: "Email atau username tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        { field: "newPassword", message: "Password baru tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { field: "newPassword", message: "Password minimal 8 karakter" },
        { status: 400 }
      );
    }

    if (!hasDigit(newPassword)) {
      return NextResponse.json(
        { field: "newPassword", message: "Password harus mengandung angka" },
        { status: 400 }
      );
    }

    if (!confirmPassword) {
      return NextResponse.json(
        { field: "confirmPassword", message: "Konfirmasi password tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { field: "confirmPassword", message: "Password tidak cocok" },
        { status: 400 }
      );
    }

    const admin = await findAdminByLogin(login);
    if (!admin) {
      return NextResponse.json(
        { field: "login", message: "Email atau username tidak ditemukan" },
        { status: 404 }
      );
    }

    const nextHash = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE shipin_users SET password_hash = $2 WHERE id = $1`, [admin.id, nextHash]);

    return NextResponse.json({
      ok: true,
      message: "Password berhasil diubah! Mengalihkan ke halaman login..."
    });
  } catch (error) {
    console.error("POST /api/admin/password-reset failed", error);
    return NextResponse.json(
      { message: "Gagal menyimpan password baru, coba lagi" },
      { status: 500 }
    );
  }
}
