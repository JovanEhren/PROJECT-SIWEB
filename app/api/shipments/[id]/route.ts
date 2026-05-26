import { NextRequest, NextResponse } from "next/server";

import { pool } from "@/lib/db";
import { CHECKPOINT_STATUS } from "@/lib/utils/checkpoint-shared";
import { addCheckpoint, syncShipmentCheckpoints } from "@/lib/utils/checkpoint";

function toDbShipmentStatus(status?: string) {
  if (status === "SAMPAI" || status === "Sampai Tujuan" || status === "Selesai") return "SAMPAI";
  if (status === "DALAM PERJALANAN" || status === "Dalam Pengiriman" || status === "Dikirim") return "DALAM_PERJALANAN";
  return "DIJADWALKAN";
}

function toDbPaymentStatus(status?: string) {
  return status === "LUNAS" || status === "Lunas" || status === "Selesai" ? "LUNAS" : "BELUM_BAYAR";
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();

  try {
    const shipmentInfo = await pool.query<{ origin_city: string; destination_city: string }>(
      `SELECT oa.city as origin_city, da.city as destination_city
       FROM shipin_shipments s
       JOIN shipin_addresses oa ON oa.id = s.origin_address_id
       JOIN shipin_addresses da ON da.id = s.destination_address_id
       WHERE s.resi_code = $1`,
      [id]
    );

    const result = await pool.query<{ id: string }>(
      `
        UPDATE shipin_shipments
        SET
          shipment_status = COALESCE($2::shipin_shipment_status, shipment_status),
          payment_status = COALESCE($3::shipin_payment_status, payment_status),
          item_status = COALESCE($4, item_status),
          total_amount = COALESCE($5::numeric, total_amount),
          vehicle_id = COALESCE($6::smallint, vehicle_id),
          delivered_at = CASE WHEN COALESCE($2::shipin_shipment_status, shipment_status) = 'SAMPAI' THEN COALESCE(delivered_at, NOW()) ELSE delivered_at END
        WHERE resi_code = $1
        RETURNING id
      `,
      [
        id,
        body.shipment ? toDbShipmentStatus(body.shipment) : null,
        body.payment ? toDbPaymentStatus(body.payment) : null,
        body.itemStatus || null,
        body.total != null ? Number(body.total) : null,
        body.vehicleId != null ? Number(body.vehicleId) : null
      ]
    );

    if (!result.rows[0]) {
      return NextResponse.json({ message: "Data pengiriman tidak ditemukan." }, { status: 404 });
    }

    // Add checkpoint when shipment status changes
    if (body.shipment) {
      const dbStatus = toDbShipmentStatus(body.shipment);
      const originCity = shipmentInfo.rows[0]?.origin_city || "Kota Asal";
      const destCity = shipmentInfo.rows[0]?.destination_city || "Kota Tujuan";

      const checkpointMap: Record<string, { status: string; desc: string; lokasi: string }> = {
        SAMPAI: {
          status: CHECKPOINT_STATUS.SELESAI,
          desc: "Paket telah sampai di tujuan dan diterima oleh penerima.",
          lokasi: destCity
        },
        DALAM_PERJALANAN: {
          status: CHECKPOINT_STATUS.DALAM_PERJALANAN,
          desc: "Paket sedang dalam perjalanan menuju kota tujuan.",
          lokasi: destCity
        },
        DIJADWALKAN: {
          status: CHECKPOINT_STATUS.PICKUP_DIJADWALKAN,
          desc: "Paket pickup dijadwalkan dan menunggu penjemputan oleh kurir.",
          lokasi: originCity
        }
      };

      const checkpoint = checkpointMap[dbStatus];
      if (checkpoint) {
        await addCheckpoint(id, checkpoint.status, checkpoint.desc, checkpoint.lokasi);
      }
    }

    await pool.query(
      `
        UPDATE shipin_payments
        SET
          amount = COALESCE($2::numeric, amount),
          payment_status = COALESCE($3::shipin_payment_status, payment_status),
          paid_at = CASE WHEN COALESCE($3::shipin_payment_status, payment_status) = 'LUNAS' THEN COALESCE(paid_at, NOW()) ELSE NULL END
        WHERE shipment_id = $1
      `,
      [
        result.rows[0].id,
        body.total != null ? Number(body.total) : null,
        body.payment ? toDbPaymentStatus(body.payment) : null
      ]
    );

    if (body.vehiclePatch?.id) {
      await pool.query(
        `
          UPDATE shipin_vehicles
          SET
            vehicle_name = COALESCE($2, vehicle_name),
            vehicle_type = COALESCE($3, vehicle_type),
            plate_number = COALESCE($4, plate_number),
            capacity_kg = COALESCE($5::numeric, capacity_kg),
            vehicle_status = COALESCE($6, vehicle_status)
          WHERE id = $1
        `,
        [
          Number(body.vehiclePatch.id),
          body.vehiclePatch.vehicleName || null,
          body.vehiclePatch.vehicleType || null,
          body.vehiclePatch.plateNumber || null,
          body.vehiclePatch.capacityKg != null ? Number(body.vehiclePatch.capacityKg) : null,
          body.vehiclePatch.vehicleStatus || null
        ]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Gagal memperbarui data." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await pool.query("DELETE FROM shipin_shipments WHERE resi_code = $1 RETURNING id", [id]);

  if (!result.rows[0]) {
    return NextResponse.json({ message: "Data pengiriman tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
