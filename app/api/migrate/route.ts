import { NextResponse } from "next/server";

// Migration: add unique constraint to riwayat_pengiriman table
// This ensures ON CONFLICT DO NOTHING works correctly

export async function POST() {
  try {
    const { db } = await import("@/lib/db");

    // Check if constraint already exists
    const constraintCheck = await db.query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'riwayat_pengiriman_unique_resi_status'
      )`
    );

    if (constraintCheck.rows[0]?.exists) {
      return NextResponse.json({
        message: "ConstraintAlready exists, no changes made.",
        status: "skipped"
      });
    }

    // Add unique constraint
    await db.query(
      `ALTER TABLE riwayat_pengiriman
       ADD CONSTRAINT riwayat_pengiriman_unique_resi_status
       UNIQUE (resi_id, status)`
    );

    return NextResponse.json({
      message: "Constraint added successfully.",
      status: "success"
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Migration failed.",
        status: "error"
      },
      { status: 500 }
    );
  }
}

// Also expose GET to check migration status
export async function GET() {
  try {
    const { db } = await import("@/lib/db");

    const constraintCheck = await db.query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'riwayat_pengiriman_unique_resi_status'
      )`
    );

    return NextResponse.json({
      constraint_exists: constraintCheck.rows[0]?.exists ?? false
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Check failed." },
      { status: 500 }
    );
  }
}
