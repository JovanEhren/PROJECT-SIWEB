import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_IDENTITY_COOKIE,
  ADMIN_SESSION_ROLE_COOKIE
} from "@/lib/auth";
import { findAdminByLogin } from "@/lib/server/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const login = String(body.login || "").trim();
    const password = String(body.password || "");
    const remember = Boolean(body.remember);

    if (!login || !password) {
      return NextResponse.json({ message: "Login dan password wajib diisi." }, { status: 400 });
    }

    const admin = await findAdminByLogin(login);
    if (!admin?.passwordHash) {
      return NextResponse.json({ message: "Username atau password admin tidak sesuai." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ message: "Username atau password admin tidak sesuai." }, { status: 401 });
    }

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
    console.error("POST /api/admin/session failed", error);
    return NextResponse.json({ message: "Gagal memproses login admin." }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
  response.cookies.set(ADMIN_SESSION_IDENTITY_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
  response.cookies.set(ADMIN_SESSION_ROLE_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
  return response;
}
