import { NextRequest, NextResponse } from "next/server";

import { pool } from "@/lib/db";
import { CHECKPOINT_STATUS } from "@/lib/utils/checkpoint-shared";
import { addCheckpoint, syncShipmentCheckpoints } from "@/lib/utils/checkpoint";
import { getDemoTrackingDurationMs } from "@/lib/tracking-config";

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
  return status;
}

function toPaymentStatus(status: ShipmentRow["payment_status"]) {
  if (status === "BELUM_BAYAR") return "BELUM BAYAR";
  return status;
}

function toMillis(value: string | null) {
  return value ? new Date(value).getTime() : undefined;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function mapRows(rows: ShipmentRow[], events: TrackingRow[]) {
  const eventsByShipment = new Map<string, TrackingRow[]>();
  events.forEach((event) => {
    const current = eventsByShipment.get(event.shipment_id) || [];
    current.push(event);
    eventsByShipment.set(event.shipment_id, current);
  });

  return rows.map((row) => {
    const trackingEvents = (eventsByShipment.get(row.id) || [])
      .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())
      .map((event) => ({
        id: String(event.id),
        status: event.event_status,
        description: event.description,
        locationLabel: event.location_label,
        lat: Number(event.lat || 0),
        lng: Number(event.lng || 0),
        occurredAt: new Date(event.occurred_at).getTime()
      }));
    const latest = trackingEvents[trackingEvents.length - 1];
    const senderAddress = `${row.origin_detail}, ${row.origin_city}, ${row.origin_province}`;
    const receiverAddress = `${row.destination_detail}, ${row.destination_city}, ${row.destination_province}`;

    return {
      id: row.resi_code,
      uuid: row.id,
      type: row.service_code,
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
      latestLat: latest?.lat,
      latestLng: latest?.lng,
      trackingEvents,
      lastTrackingUpdateAt: latest?.occurredAt
    };
  });
}

async function loadShipments(search = "") {
  const keyword = `%${search.trim()}%`;
  const params = search.trim() ? [keyword] : [];
  const where = search.trim()
    ? `WHERE s.resi_code ILIKE $1
        OR c.full_name ILIKE $1
        OR s.receiver_name ILIKE $1
        OR s.package_type ILIKE $1`
    : "";

  const result = await pool.query<ShipmentRow>(
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
      ${where}
      ORDER BY s.created_at DESC
    `,
    params
  );

  if (!result.rows.length) return [];

  const eventResult = await pool.query<TrackingRow>(
    `
      SELECT id::text, shipment_id::text, event_status, description, location_label, lat, lng, occurred_at
      FROM shipin_tracking_events
      WHERE shipment_id = ANY($1::uuid[])
      ORDER BY occurred_at ASC
    `,
    [result.rows.map((row) => row.id)]
  );

  return mapRows(result.rows, eventResult.rows);
}

function generateResi() {
  return `SPG-${Date.now().toString().slice(-6)}-ID`;
}

function serviceIdFromType(value: string) {
  const normalized = value.toUpperCase();
  if (normalized === "CEPAT" || normalized === "EKSPRES") return 2;
  if (normalized === "VVIP" || normalized === "SAME_DAY") return 4;
  return 1;
}

function categoryIdFromPackage(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("dokumen")) return 1;
  if (normalized.includes("elektronik")) return 3;
  if (normalized.includes("makanan")) return 4;
  if (normalized.includes("buku")) return 7;
  if (normalized.includes("frozen")) return 10;
  return 2;
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") || "";
  const shipments = await loadShipments(search);
  return NextResponse.json({ shipments });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const resiCode = generateResi();
  const serviceCode = String(body.service || "").toUpperCase() === "EKSPRES" ? "EKSPRES" : "REGULER";
  const durasiEstimasiMs =
    body.durasiEstimasiMs != null
      ? parseInt(body.durasiEstimasiMs)
      : getDemoTrackingDurationMs(serviceCode);
  const estimatedArrivalAt = new Date(Date.now() + durasiEstimasiMs);

  try {
    const customer = await pool.query<{ id: string }>(
      `
        INSERT INTO shipin_users (full_name, email, phone, role, password_hash)
        VALUES ($1, $2, $3, 'CUSTOMER', 'created_from_admin_cruds')
        RETURNING id
      `,
      [
        String(body.senderName || "").trim(),
        `customer.${resiCode.toLowerCase()}@shipingo.local`,
        String(body.senderPhone || "").trim()
      ]
    );

    const originAddress = await pool.query<{ id: string }>(
      `
        INSERT INTO shipin_addresses (user_id, label, city, province, postal_code, detail_address, is_primary)
        VALUES ($1, 'Alamat Pengirim', $2, $3, $4, $5, true)
        RETURNING id
      `,
      [
        customer.rows[0].id,
        body.originCity,
        body.originProvince,
        body.originPostalCode || "",
        body.originAddress
      ]
    );

    const destinationAddress = await pool.query<{ id: string }>(
      `
        INSERT INTO shipin_addresses (user_id, label, city, province, postal_code, detail_address, is_primary)
        VALUES ($1, 'Alamat Penerima', $2, $3, $4, $5, false)
        RETURNING id
      `,
      [
        customer.rows[0].id,
        body.destinationCity,
        body.destinationProvince,
        body.destinationPostalCode || "",
        body.destinationAddress
      ]
    );

    const originHub = await pool.query<{ id: number }>(
      "SELECT id FROM shipin_hubs ORDER BY CASE WHEN city ILIKE $1 THEN 0 ELSE 1 END, id LIMIT 1",
      [`%${body.originCity || ""}%`]
    );
    const destinationHub = await pool.query<{ id: number }>(
      "SELECT id FROM shipin_hubs ORDER BY CASE WHEN city ILIKE $1 THEN 0 ELSE 1 END, id LIMIT 1",
      [`%${body.destinationCity || ""}%`]
    );
    const vehicleId =
      Number(body.vehicleId) ||
      (
        await pool.query<{ id: number }>(
          "SELECT id FROM shipin_vehicles WHERE vehicle_status = 'AKTIF' ORDER BY id LIMIT 1"
        )
      ).rows[0]?.id;

    const serviceId = serviceIdFromType(body.deliveryType || body.service || "BIASA");
    const shipment = await pool.query<{ id: string }>(
      `
        INSERT INTO shipin_shipments (
          resi_code, customer_id, service_id, origin_address_id, destination_address_id,
          package_category_id, origin_hub_id, destination_hub_id, vehicle_id, receiver_name,
          receiver_phone, package_type, item_status, item_note, weight_kg, length_cm, width_cm,
          height_cm, total_amount, payment_status, shipment_status, estimated_arrival_at,
          koordinat_asal_lat, koordinat_asal_lng, koordinat_tujuan_lat, koordinat_tujuan_lng,
          waktu_berangkat, durasi_estimasi_ms
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, 'DIPROSES', $13, $14, $15, $16,
          $17, $18, 'LUNAS', 'DIJADWALKAN', $19,
          $20, $21, $22, $23, $24, $25
        )
        RETURNING id
      `,
      [
        resiCode,
        customer.rows[0].id,
        serviceId,
        originAddress.rows[0].id,
        destinationAddress.rows[0].id,
        categoryIdFromPackage(body.packageType || ""),
        originHub.rows[0]?.id || 1,
        destinationHub.rows[0]?.id || 1,
        vehicleId,
        String(body.receiverName || "").trim(),
        String(body.receiverPhone || "").trim(),
        String(body.packageType || "Barang Cargo").trim(),
        String(body.itemNote || "").trim(),
        Number(body.weightKg) || 1,
        Number(body.lengthCm) || 0,
        Number(body.widthCm) || 0,
        Number(body.heightCm) || 0,
        Number(body.totalAmount) || 0,
        estimatedArrivalAt.toISOString(),
        body.originLat != null ? parseFloat(body.originLat) : null,
        body.originLng != null ? parseFloat(body.originLng) : null,
        body.destinationLat != null ? parseFloat(body.destinationLat) : null,
        body.destinationLng != null ? parseFloat(body.destinationLng) : null,
        body.waktuBerangkat != null ? parseInt(body.waktuBerangkat) : null,
        durasiEstimasiMs
      ]
    );

    await pool.query(
      `
        INSERT INTO shipin_payments (shipment_id, invoice_number, payment_method, amount, payment_status, paid_at)
        VALUES ($1, $2, 'QRIS', $3, 'LUNAS', NOW())
      `,
      [shipment.rows[0].id, `INV-${resiCode.replace("-ID", "")}`, Number(body.totalAmount) || 0]
    );

    await pool.query(
      `
        INSERT INTO shipin_tracking_events (shipment_id, event_status, description, location_label, lat, lng, occurred_at)
        VALUES ($1, 'Pesanan diterima', 'Data cargo berhasil dibuat dan masuk database.', $2, NULL, NULL, NOW())
      `,
      [shipment.rows[0].id, body.originCity || "Hub Asal"]
    );

    await addCheckpoint(
      resiCode,
      CHECKPOINT_STATUS.PESANAN_DITERIMA,
      "Pesanan berhasil dibuat dan masuk ke sistem SHIPIN GO.",
      body.originCity || "Kota Asal"
    );

    await syncShipmentCheckpoints({
      resi: resiCode,
      originCity: body.originCity || "Kota Asal",
      destinationCity: body.destinationCity || "Kota Tujuan",
      shipmentStatus: "DIJADWALKAN",
      waktuBerangkat: body.waktuBerangkat ?? null,
      durasiEstimasiMs
    });

    await pool.query(
      `
        UPDATE riwayat_pengiriman
        SET
          deskripsi = $2,
          lokasi = $3
        WHERE resi_id = $1
          AND status = $4
      `,
      [
        resiCode,
        "Pesanan berhasil dibuat dan masuk ke sistem SHIPIN GO.",
        body.originCity || "Kota Asal",
        CHECKPOINT_STATUS.PESANAN_DITERIMA
      ]
    );

    return NextResponse.json(
      {
        shipment: {
          id: resiCode,
          total: Number(body.totalAmount) || 0
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Gagal membuat pengiriman." },
      { status: 500 }
    );
  }
}

