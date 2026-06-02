import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { pool } from "@/lib/db";
import { getCurrentAdminFromRequest } from "@/lib/server/admin-auth";

type StatsRow = {
  total_shipments: string;
  average_rating: string | null;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string) {
  return password.length >= 8 && /\d/.test(password);
}

async function loadStats(adminId: string) {
  const hasReviews = await pool.query<{ exists: string | null }>(
    `SELECT to_regclass('public.shipin_reviews')::text AS exists`
  );

  const ratingSelect = hasReviews.rows[0]?.exists
    ? `(SELECT ROUND(COALESCE(AVG(stars), 0), 1) FROM shipin_reviews)::text AS average_rating`
    : `NULL::text AS average_rating`;

  const stats = await pool.query<StatsRow>(
    `
      SELECT
        (SELECT COUNT(*)::text FROM shipin_shipments WHERE created_by_admin_id = $1) AS total_shipments,
        ${ratingSelect}
    `,
    [adminId]
  );

  return {
    totalShipments: Number(stats.rows[0]?.total_shipments || 0),
    rating: Number(stats.rows[0]?.average_rating || 0),
  };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ message: "Sesi admin tidak valid." }, { status: 401 });
    }

    const dbNow = await pool.query<{ now: string }>("SELECT NOW()::text AS now");
    console.log("Neon connection check /api/admin/profile GET:", dbNow.rows[0]?.now);

    const stats = await loadStats(admin.id);

    return NextResponse.json({
      profile: {
        id: admin.id,
        fullName: admin.fullName,
        username: admin.username,
        email: admin.email,
        status: admin.accountStatus,
        totalShipments: stats.totalShipments,
        rating: stats.rating
      }
    });
  } catch (error) {
    console.error("GET /api/admin/profile failed", error);
    return NextResponse.json({ message: "Gagal memuat profil admin." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await getCurrentAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ message: "Sesi admin tidak valid." }, { status: 401 });
    }

    const body = await request.json();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();

    if (!fullName) {
      return NextResponse.json({ message: "Nama lengkap tidak boleh kosong." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ message: "Format email tidak valid." }, { status: 400 });
    }

    const duplicate = await pool.query<{ id: string }>(
      `
        SELECT id
        FROM shipin_users
        WHERE LOWER(email) = $1 AND id <> $2
        LIMIT 1
      `,
      [email, admin.id]
    );

    if (duplicate.rows[0]) {
      return NextResponse.json({ message: "Email sudah digunakan akun lain." }, { status: 409 });
    }

    await pool.query(
      `
        UPDATE shipin_users
        SET full_name = $2, email = $3
        WHERE id = $1
      `,
      [admin.id, fullName, email]
    );

    const fresh = await getCurrentAdminFromRequest(request);
    const stats = await loadStats(admin.id);

    return NextResponse.json({
      ok: true,
      profile: {
        id: fresh?.id || admin.id,
        fullName: fresh?.fullName || fullName,
        username: fresh?.username || admin.username,
        email: fresh?.email || email,
        status: fresh?.accountStatus || admin.accountStatus,
        totalShipments: stats.totalShipments,
        rating: stats.rating
      }
    });
  } catch (error) {
    console.error("PUT /api/admin/profile failed", error);
    return NextResponse.json({ message: "Gagal memperbarui detail akun." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getCurrentAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ message: "Sesi admin tidak valid." }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ message: "Lengkapi semua kolom kata sandi." }, { status: 400 });
    }

    const currentMatches = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!currentMatches) {
      return NextResponse.json({ message: "Kata sandi saat ini tidak cocok." }, { status: 400 });
    }

    if (!isValidPassword(newPassword)) {
      return NextResponse.json(
        { message: "Kata sandi baru minimal 8 karakter dan mengandung angka." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: "Konfirmasi kata sandi baru tidak cocok." }, { status: 400 });
    }

    const nextHash = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE shipin_users SET password_hash = $2 WHERE id = $1`, [admin.id, nextHash]);

    return NextResponse.json({ ok: true, message: "Kata sandi berhasil diperbarui." });
  } catch (error) {
    console.error("PATCH /api/admin/profile failed", error);
    return NextResponse.json({ message: "Gagal memperbarui kata sandi." }, { status: 500 });
  }
}
