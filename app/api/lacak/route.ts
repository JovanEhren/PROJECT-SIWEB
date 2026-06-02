import { NextRequest, NextResponse } from "next/server";

import { pool } from "@/lib/db";
import { getCheckpointsByResi, syncShipmentCheckpoints } from "@/lib/utils/checkpoint";

type ShipmentRow = {
  id: string;
  resi_code: string;
  sender_name: string;
  sender_phone: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  origin_city: string;
  origin_province: string;
  origin_detail: string;
  destination_city: string;
  destination_province: string;
  destination_detail: string;
  item_name: string | null;
  item_category: string | null;
  package_type: string;
  item_status: string | null;
  item_note: string | null;
  weight_kg: string;
  length_cm: string | null;
  width_cm: string | null;
  height_cm: string | null;
  total_amount: string;
  payment_status: "LUNAS" | "BELUM_BAYAR";
  shipment_status: "DIJADWALKAN" | "DALAM_PERJALANAN" | "SAMPAI";
  service_code: string;
  service_name: string;
  vehicle_id: number | null;
  vehicle_name: string | null;
  vehicle_type: string | null;
  plate_number: string | null;
  capacity_kg: string | null;
  vehicle_status: string | null;
  created_at: string;
  estimated_arrival_at: string | null;
  delivered_at: string | null;
  koordinat_asal_lat: string | null;
  koordinat_asal_lng: string | null;
  koordinat_tujuan_lat: string | null;
  koordinat_tujuan_lng: string | null;
  waktu_berangkat: string | null;
  durasi_estimasi_ms: string | null;
};

type TrackingRow = {
  id: string;
  shipment_id: string;
  event_status: string;
  description: string;
  location_label: string;
  lat: string | null;
  lng: string | null;
  occurred_at: string;
};

function toShipmentStatus(status: ShipmentRow["shipment_status"]) {
  if (status === "DALAM_PERJALANAN") return "DALAM PERJALANAN";
  if (status === "SAMPAI") return "SELESAI";
  return "DIJADWALKAN";
}

function toPaymentStatus(status: ShipmentRow["payment_status"]) {
  if (status === "BELUM_BAYAR") return "BELUM BAYAR";
  return status;
}

function toMillis(value: string | null) {
  return value ? new Date(value).getTime() : undefined;
}

function toNumber(value: string | null) {
  if (!value) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function mapShipment(row: ShipmentRow, events: TrackingRow[]) {
  const trackingEvents = [...events]
    .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())
    .map((event) => ({
      id: String(event.id),
      status: event.event_status,
      description: event.description,
      locationLabel: event.location_label,
      lat: event.lat != null ? Number(event.lat) : null,
      lng: event.lng != null ? Number(event.lng) : null,
      occurredAt: new Date(event.occurred_at).getTime()
    }));
  const latest = trackingEvents[trackingEvents.length - 1];
  const senderAddress = `${row.origin_detail}, ${row.origin_city}, ${row.origin_province}`;
  const receiverAddress = `${row.destination_detail}, ${row.destination_city}, ${row.destination_province}`;

  return {
    id: row.resi_code,
    uuid: row.id,
    type: row.service_code,
    itemName: row.item_name || row.package_type,
    itemCategory: row.item_category || row.package_type,
    sender: row.sender_name,
    receiver: row.receiver_name || "-",
    destination: `${row.origin_city} | ${row.destination_city}`,
    date: formatDate(row.created_at),
    payment: toPaymentStatus(row.payment_status),
    shipment: toShipmentStatus(row.shipment_status),
    itemStatus: row.item_status || "DIPROSES",
    itemNote: row.item_note || "",
    total: Number(row.total_amount),
    createdAt: new Date(row.created_at).getTime(),
    senderAddress,
    receiverAddress,
    originProvince: row.origin_province,
    destinationProvince: row.destination_province,
    originCity: row.origin_city,
    destinationCity: row.destination_city,
    senderPhone: row.sender_phone || "",
    receiverPhone: row.receiver_phone || "",
    weightKg: Number(row.weight_kg),
    lengthCm: Number(row.length_cm || 0),
    widthCm: Number(row.width_cm || 0),
    heightCm: Number(row.height_cm || 0),
    service: row.service_code === "EKSPRES" ? "EKSPRES" : "REGULER",
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name || "",
    vehicleType: row.vehicle_type || "",
    plateNumber: row.plate_number || "",
    vehicleCapacityKg: Number(row.capacity_kg || 0),
    vehicleStatus: row.vehicle_status || "",
    estimatedArrivalAt: toMillis(row.estimated_arrival_at),
    deliveredAt: toMillis(row.delivered_at),
    koordinatAsalLat: row.koordinat_asal_lat ? parseFloat(row.koordinat_asal_lat) : null,
    koordinatAsalLng: row.koordinat_asal_lng ? parseFloat(row.koordinat_asal_lng) : null,
    koordinatTujuanLat: row.koordinat_tujuan_lat ? parseFloat(row.koordinat_tujuan_lat) : null,
    koordinatTujuanLng: row.koordinat_tujuan_lng ? parseFloat(row.koordinat_tujuan_lng) : null,
    waktuBerangkat: row.waktu_berangkat ? parseInt(row.waktu_berangkat) : null,
    durasiEstimasiMs: row.durasi_estimasi_ms ? parseInt(row.durasi_estimasi_ms) : null,
    latestLocationLabel: latest?.locationLabel,
    latestLat: latest?.lat ?? undefined,
    latestLng: latest?.lng ?? undefined,
    trackingEvents,
    lastTrackingUpdateAt: latest?.occurredAt
  };
}

function getSyncedRowSnapshot(row: ShipmentRow) {
  const waktuBerangkat = toNumber(row.waktu_berangkat);
  const durasiEstimasiMs = toNumber(row.durasi_estimasi_ms);

  if (
    row.shipment_status !== "SAMPAI" &&
    waktuBerangkat &&
    durasiEstimasiMs &&
    durasiEstimasiMs > 0 &&
    Date.now() - waktuBerangkat >= durasiEstimasiMs
  ) {
    return {
      ...row,
      shipment_status: "SAMPAI" as const,
      item_status: "SELESAI",
      delivered_at: row.delivered_at || new Date().toISOString()
    };
  }

  return row;
}

export async function GET(request: NextRequest) {
  const resi = (request.nextUrl.searchParams.get("resi") || "").trim();
  if (!resi) {
    return NextResponse.json({ shipment: null, checkpoints: [] });
  }

  try {
    const shipmentResult = await pool.query<ShipmentRow>(
      `
        SELECT
          s.id,
          s.resi_code,
          c.full_name AS sender_name,
          c.phone AS sender_phone,
          s.receiver_name,
          s.receiver_phone,
          oa.city AS origin_city,
          oa.province AS origin_province,
          oa.detail_address AS origin_detail,
          da.city AS destination_city,
          da.province AS destination_province,
          da.detail_address AS destination_detail,
          s.item_name,
          s.item_category,
          s.package_type,
          s.item_status,
          s.item_note,
          s.weight_kg,
          s.length_cm,
          s.width_cm,
          s.height_cm,
          s.total_amount,
          s.payment_status,
          s.shipment_status,
          sv.code AS service_code,
          sv.display_name AS service_name,
          v.id AS vehicle_id,
          v.vehicle_name,
          v.vehicle_type,
          v.plate_number,
          v.capacity_kg,
          v.vehicle_status,
          s.created_at,
          s.estimated_arrival_at,
          s.delivered_at,
          s.koordinat_asal_lat,
          s.koordinat_asal_lng,
          s.koordinat_tujuan_lat,
          s.koordinat_tujuan_lng,
          s.waktu_berangkat,
          s.durasi_estimasi_ms
        FROM shipin_shipments s
        JOIN shipin_users c ON c.id = s.customer_id
        JOIN shipin_addresses oa ON oa.id = s.origin_address_id
        JOIN shipin_addresses da ON da.id = s.destination_address_id
        JOIN shipin_shipping_services sv ON sv.id = s.service_id
        LEFT JOIN shipin_vehicles v ON v.id = s.vehicle_id
        WHERE s.resi_code = $1
        LIMIT 1
      `,
      [resi]
    );

    const row = shipmentResult.rows[0];
    if (!row) {
      return NextResponse.json({ shipment: null, checkpoints: [] });
    }

    await syncShipmentCheckpoints({
      resi: row.resi_code,
      originCity: row.origin_city,
      destinationCity: row.destination_city,
      shipmentStatus: row.shipment_status,
      waktuBerangkat: row.waktu_berangkat,
      durasiEstimasiMs: row.durasi_estimasi_ms
    });

    const eventResult = await pool.query<TrackingRow>(
      `
        SELECT id::text, shipment_id::text, event_status, description, location_label, lat, lng, occurred_at
        FROM shipin_tracking_events
        WHERE shipment_id = $1::uuid
        ORDER BY occurred_at ASC
      `,
      [row.id]
    );

    const shipment = mapShipment(getSyncedRowSnapshot(row), eventResult.rows);
    const checkpoints = await getCheckpointsByResi(resi);

    return NextResponse.json({ shipment, checkpoints });
  } catch (error) {
    return NextResponse.json(
      {
        shipment: null,
        checkpoints: [],
        message: error instanceof Error ? error.message : "Gagal mengambil data lacak."
      },
      { status: 500 }
    );
  }
}
