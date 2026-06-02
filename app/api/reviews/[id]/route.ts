import { NextRequest, NextResponse } from "next/server";

import { pool } from "@/lib/db";
import { getCurrentAdminFromRequest } from "@/lib/server/admin-auth";

type ReviewRow = {
  id: string;
  stars: number;
  review_text: string;
  is_visible: boolean;
  created_at: string;
  shipment_id: string | null;
  reviewer_name: string | null;
  customer_name: string | null;
  reviewer_token: string | null;
};

function initialsFromName(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "US"
  );
}

function formatMeta(date: string, shipmentId: string | null) {
  const label = new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
  return `${label} | ID Transaksi: ${shipmentId ? shipmentId.slice(0, 8).toUpperCase() : "PUBLIC"}`;
}

function mapReview(row: ReviewRow) {
  const name = row.reviewer_name || row.customer_name || "Pengguna SHIPIN GO";
  return {
    id: row.id,
    initials: initialsFromName(name),
    name,
    stars: row.stars,
    text: row.review_text.startsWith('"') ? row.review_text : `"${row.review_text}"`,
    meta: formatMeta(row.created_at, row.shipment_id),
    visible: row.is_visible,
    avatarBg: "bg-[#d5efd8] text-[#11623a]"
  };
}

async function getReview(id: string) {
  const result = await pool.query<ReviewRow>(
    `
      SELECT
        r.id::text,
        r.stars,
        r.review_text,
        r.is_visible,
        r.created_at,
        r.shipment_id::text,
        r.reviewer_name,
        r.reviewer_token,
        u.full_name AS customer_name
      FROM shipin_reviews r
      JOIN shipin_users u ON u.id = r.customer_id
      WHERE r.id = $1::uuid
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

function hasOwnership(admin: unknown, row: ReviewRow | null, token: string) {
  return Boolean(admin) || (row?.reviewer_token && token && row.reviewer_token === token);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const admin = await getCurrentAdminFromRequest(request);
    const current = await getReview(id);

    if (!current) {
      return NextResponse.json({ message: "Ulasan tidak ditemukan." }, { status: 404 });
    }

    const reviewerToken = String(body.reviewerToken || "");
    if (!hasOwnership(admin, current, reviewerToken)) {
      return NextResponse.json({ message: "Anda tidak memiliki akses ke ulasan ini." }, { status: 403 });
    }

    const nextName = body.name != null ? String(body.name).trim() : current.reviewer_name || current.customer_name || "";
    const nextText = body.text != null ? String(body.text).trim() : current.review_text;
    const nextStars = body.stars != null ? Number(body.stars) : current.stars;
    const nextVisible = body.visible != null ? Boolean(body.visible) : current.is_visible;

    if (!nextName || !nextText) {
      return NextResponse.json({ message: "Nama dan pesan ulasan wajib diisi." }, { status: 400 });
    }

    if (!Number.isInteger(nextStars) || nextStars < 1 || nextStars > 5) {
      return NextResponse.json({ message: "Rating harus antara 1 sampai 5." }, { status: 400 });
    }

    const result = await pool.query<ReviewRow>(
      `
        UPDATE shipin_reviews
        SET reviewer_name = $2, stars = $3, review_text = $4, is_visible = $5
        FROM shipin_users u
        WHERE shipin_reviews.id = $1::uuid AND u.id = shipin_reviews.customer_id
        RETURNING
          shipin_reviews.id::text,
          shipin_reviews.stars,
          shipin_reviews.review_text,
          shipin_reviews.is_visible,
          shipin_reviews.created_at,
          shipin_reviews.shipment_id::text,
          shipin_reviews.reviewer_name,
          shipin_reviews.reviewer_token,
          u.full_name AS customer_name
      `,
      [id, nextName, nextStars, nextText, nextVisible]
    );

    return NextResponse.json({ review: mapReview(result.rows[0]) });
  } catch (error) {
    console.error("PATCH /api/reviews/[id] failed", error);
    return NextResponse.json({ message: "Gagal memperbarui ulasan." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const admin = await getCurrentAdminFromRequest(request);
    const row = await getReview(id);

    if (!row) {
      return NextResponse.json({ message: "Ulasan tidak ditemukan." }, { status: 404 });
    }

    const reviewerToken = request.nextUrl.searchParams.get("reviewerToken") || "";
    if (!hasOwnership(admin, row, reviewerToken)) {
      return NextResponse.json({ message: "Anda tidak memiliki akses ke ulasan ini." }, { status: 403 });
    }

    await pool.query(`DELETE FROM shipin_reviews WHERE id = $1::uuid`, [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/reviews/[id] failed", error);
    return NextResponse.json({ message: "Gagal menghapus ulasan." }, { status: 500 });
  }
}
