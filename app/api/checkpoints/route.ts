import { NextRequest, NextResponse } from "next/server";

import { pool } from "@/lib/db";
import { getCheckpointsByResi } from "@/lib/utils/checkpoint";

/**
 * GET /api/checkpoints?resi=SPG-123456-ID
 * Fetch checkpoint/riwayat data for a specific shipment resi.
 * Optimized for speed - no blocking operations.
 */
export async function GET(request: NextRequest) {
  const resi = request.nextUrl.searchParams.get("resi");

  if (!resi) {
    return NextResponse.json({ checkpoints: [] });
  }

  try {
    // Direct query - fast path
    const checkpoints = await getCheckpointsByResi(resi);
    return NextResponse.json({ checkpoints });
  } catch {
    return NextResponse.json({ checkpoints: [] });
  }
}