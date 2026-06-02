import crypto from "node:crypto";

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

async function getPublicReviewerId() {
  const result = await pool.query<{ id: string }>(
    `SELECT id FROM shipin_users WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' LIMIT 1`
  );
  return result.rows[0]?.id || "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
}

export async function GET(request: NextRequest) {
  try {
    const includeHidden = request.nextUrl.searchParams.get("includeHidden") === "1";
    const admin = await getCurrentAdminFromRequest(request);
    const canSeeAll = includeHidden && admin;

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
          u.full_name AS customer_name
        FROM shipin_reviews r
        JOIN shipin_users u ON u.id = r.customer_id
        ${canSeeAll ? "" : "WHERE r.is_visible = TRUE"}
        ORDER BY r.created_at DESC
      `
    );

    return NextResponse.json({ reviews: result.rows.map(mapReview) });
  } catch (error) {
    console.error("GET /api/reviews failed", error);
    return NextResponse.json({ message: "Gagal memuat ulasan." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const text = String(body.text || "").trim();
    const stars = Number(body.stars) || 0;

    if (!name || !text) {
      return NextResponse.json({ message: "Nama dan pesan ulasan wajib diisi." }, { status: 400 });
    }

    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return NextResponse.json({ message: "Rating harus antara 1 sampai 5." }, { status: 400 });
    }

    const reviewerToken = crypto.randomUUID();
    const customerId = await getPublicReviewerId();
    const result = await pool.query<ReviewRow & { reviewer_token: string }>(
      `
        INSERT INTO shipin_reviews (customer_id, reviewer_name, reviewer_token, stars, review_text, is_visible)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        RETURNING id::text, stars, review_text, is_visible, created_at, shipment_id::text, reviewer_name, reviewer_token, NULL::text AS customer_name
      `,
      [customerId, name, reviewerToken, stars, text]
    );

    return NextResponse.json({
      review: mapReview(result.rows[0]),
      reviewerToken
    });
  } catch (error) {
    console.error("POST /api/reviews failed", error);
    return NextResponse.json({ message: "Gagal menyimpan ulasan." }, { status: 500 });
  }
}
