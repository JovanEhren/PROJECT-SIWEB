import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_IDENTITY_COOKIE,
  ADMIN_SESSION_ROLE_COOKIE
} from "@/lib/auth";
import { pool } from "@/lib/db";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIGIT_PATTERN = /\d/;

type ExistingAdminRow = {
  id: string;
  username: string | null;
  email: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = String(body.fullName || "").trim();
    const username = String(body.username || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const remember = Boolean(body.remember);

    if (!fullName) {
      return NextResponse.json({ field: "fullName", message: "Nama lengkap tidak boleh kosong" }, { status: 400 });
    }

    if (!username) {
      return NextResponse.json({ field: "username", message: "Username tidak boleh kosong" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ field: "email", message: "Email tidak boleh kosong" }, { status: 400 });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ field: "email", message: "Format email tidak valid" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ field: "password", message: "Password tidak boleh kosong" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ field: "password", message: "Password minimal 8 karakter" }, { status: 400 });
    }

    if (!DIGIT_PATTERN.test(password)) {
      return NextResponse.json({ field: "password", message: "Password harus mengandung angka" }, { status: 400 });
    }

    const existingResult = await pool.query<ExistingAdminRow>(
      `
        SELECT id, username, email
        FROM shipin_users
        WHERE LOWER(email) = $1
          OR LOWER(COALESCE(username, '')) = $2
        LIMIT 2
      `,
      [email, username.toLowerCase()]
    );

    const existingEmail = existingResult.rows.find((row) => row.email.toLowerCase() === email);
    if (existingEmail) {
      return NextResponse.json({ field: "email", message: "Email sudah digunakan" }, { status: 409 });
    }

    const existingUsername = existingResult.rows.find(
      (row) => (row.username || "").toLowerCase() === username.toLowerCase()
    );
    if (existingUsername) {
      return NextResponse.json({ field: "username", message: "Username sudah digunakan" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const inserted = await pool.query<{
      id: string;
      username: string | null;
      email: string;
    }>(
      `
        INSERT INTO shipin_users (
          full_name,
          username,
          email,
          role,
          password_hash,
          account_status
        )
        VALUES ($1, $2, $3, 'ADMIN', $4, 'AKTIF')
        RETURNING id, username, email
      `,
      [fullName, username, email, passwordHash]
    );

    const admin = inserted.rows[0];
    const maxAge = remember ? 60 * 60 * 24 * 7 : 60 * 60 * 6;
    const identityMaxAge = 60 * 60 * 24 * 30;

    const response = NextResponse.json({
      ok: true,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email
      }
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, "active", {
      path: "/",
      maxAge,
      sameSite: "lax"
    });
    response.cookies.set(ADMIN_SESSION_IDENTITY_COOKIE, admin.id, {
      path: "/",
      maxAge: identityMaxAge,
      sameSite: "lax"
    });
    response.cookies.set(ADMIN_SESSION_ROLE_COOKIE, "ADMIN", {
      path: "/",
      maxAge: identityMaxAge,
      sameSite: "lax"
    });

    return response;
  } catch (error) {
    console.error("POST /api/admin/register failed", error);
    return NextResponse.json({ message: "Gagal menyimpan data, coba lagi" }, { status: 500 });
  }
}
