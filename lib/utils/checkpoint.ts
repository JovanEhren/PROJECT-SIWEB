import { db } from "@/lib/db";
import {
  CHECKPOINT_SEQUENCE,
  CHECKPOINT_STATUS,
  CheckpointRecord,
  CheckpointStatus
} from "@/lib/utils/checkpoint-shared";

type ShipmentCheckpointSnapshot = {
  resi: string;
  originCity: string;
  destinationCity: string;
  shipmentStatus?: string | null;
  waktuBerangkat?: string | number | null;
  durasiEstimasiMs?: string | number | null;
};

const STATUS_META: Record<
  CheckpointStatus,
  {
    label: string;
    defaultDescription: (originCity: string, destinationCity: string) => string;
    defaultLocation: (originCity: string, destinationCity: string) => string;
  }
> = {
  PESANAN_DITERIMA: {
    label: "Pesanan Diterima",
    defaultDescription: () => "Pesanan berhasil dibuat dan masuk ke sistem SHIPIN GO.",
    defaultLocation: (originCity) => originCity
  },
  PICKUP_DIJADWALKAN: {
    label: "Pickup Dijadwalkan",
    defaultDescription: () => "Pickup paket dijadwalkan dan menunggu penjemputan kurir.",
    defaultLocation: (originCity) => originCity
  },
  DALAM_PERJALANAN: {
    label: "Dalam Perjalanan",
    defaultDescription: (_originCity, destinationCity) =>
      `Paket sedang dalam perjalanan menuju ${destinationCity}.`,
    defaultLocation: (originCity) => originCity
  },
  TIBA_KOTA_TRANSIT: {
    label: "Tiba di Kota Transit",
    defaultDescription: (_originCity, destinationCity) =>
      `Paket tiba di kota transit sebelum dikirim ke ${destinationCity}.`,
    defaultLocation: (_originCity, destinationCity) => `Transit menuju ${destinationCity}`
  },
  DALAM_PENGIRIMAN: {
    label: "Dalam Pengiriman",
    defaultDescription: (_originCity, destinationCity) =>
      `Kurir sedang mengantar paket ke alamat penerima di ${destinationCity}.`,
    defaultLocation: (_originCity, destinationCity) => destinationCity
  },
  SELESAI: {
    label: "Paket Selesai",
    defaultDescription: (_originCity, destinationCity) =>
      `Paket telah diterima oleh penerima di ${destinationCity}.`,
    defaultLocation: (_originCity, destinationCity) => destinationCity
  }
};

function toTimestampNumber(value?: string | number | null) {
  if (typeof value === "number") return value;
  if (!value) return null;

  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeShipmentStatus(status?: string | null) {
  if (!status) return "";
  return status.replace(/\s+/g, "_").toUpperCase();
}

export async function addCheckpoint(
  resiId: string,
  status: string,
  deskripsi: string,
  lokasi: string
) {
  try {
    // Try the fast way: INSERT with ON CONFLICT (works if constraint exists)
    await db.query(
      `INSERT INTO riwayat_pengiriman (resi_id, status, deskripsi, lokasi)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (resi_id, status) DO NOTHING`,
      [resiId, status, deskripsi, lokasi]
    );
  } catch {
    // Fallback: Check if exists first, then insert (works without constraint)
    const existing = await db.query<{ id: number }>(
      `SELECT id FROM riwayat_pengiriman WHERE resi_id = $1 AND status = $2 LIMIT 1`,
      [resiId, status]
    );
    if (existing.rows.length === 0) {
      await db.query(
        `INSERT INTO riwayat_pengiriman (resi_id, status, deskripsi, lokasi) VALUES ($1, $2, $3, $4)`,
        [resiId, status, deskripsi, lokasi]
      );
    }
  }
}

export async function getCheckpointsByResi(resiId: string) {
  const result = await db.query<CheckpointRecord>(
    `
      SELECT id, resi_id, waktu, status, deskripsi, lokasi
      FROM riwayat_pengiriman
      WHERE resi_id = $1
      ORDER BY waktu DESC
    `,
    [resiId]
  );

  return result.rows;
}

function inferStatusesByProgress(snapshot: ShipmentCheckpointSnapshot) {
  const completed = new Set<CheckpointStatus>([
    CHECKPOINT_STATUS.PESANAN_DITERIMA,
    CHECKPOINT_STATUS.PICKUP_DIJADWALKAN
  ]);
  const shipmentStatus = normalizeShipmentStatus(snapshot.shipmentStatus);

  if (shipmentStatus === "SAMPAI") {
    CHECKPOINT_SEQUENCE.forEach((status) => completed.add(status));
    return completed;
  }

  if (shipmentStatus === "DALAM_PERJALANAN") {
    completed.add(CHECKPOINT_STATUS.DALAM_PERJALANAN);
  }

  const waktuBerangkat = toTimestampNumber(snapshot.waktuBerangkat);
  const durasiEstimasiMs = toTimestampNumber(snapshot.durasiEstimasiMs);

  if (!waktuBerangkat || !durasiEstimasiMs || durasiEstimasiMs <= 0) {
    return completed;
  }

  const progress = Math.max(0, Math.min(1, (Date.now() - waktuBerangkat) / durasiEstimasiMs));

  if (progress >= 0.2) completed.add(CHECKPOINT_STATUS.DALAM_PERJALANAN);
  if (progress >= 0.55) completed.add(CHECKPOINT_STATUS.TIBA_KOTA_TRANSIT);
  if (progress >= 0.85) completed.add(CHECKPOINT_STATUS.DALAM_PENGIRIMAN);
  if (progress >= 1) completed.add(CHECKPOINT_STATUS.SELESAI);

  return completed;
}

export async function syncShipmentCheckpoints(snapshot: ShipmentCheckpointSnapshot) {
  if (!snapshot.resi) return;

  const completedStatuses = inferStatusesByProgress(snapshot);
  const existingResult = await db.query<{ status: string }>(
    `SELECT status FROM riwayat_pengiriman WHERE resi_id = $1`,
    [snapshot.resi]
  );
  const existingStatuses = new Set(existingResult.rows.map((row) => row.status));

  // Filter statuses that need to be added
  const statusesToAdd = CHECKPOINT_SEQUENCE.filter(
    (status) => completedStatuses.has(status) && !existingStatuses.has(status)
  );

  // Add all missing checkpoints in parallel
  if (statusesToAdd.length > 0) {
    await Promise.all(
      statusesToAdd.map((status) => {
        const meta = STATUS_META[status];
        return addCheckpoint(
          snapshot.resi,
          status,
          meta.defaultDescription(snapshot.originCity, snapshot.destinationCity),
          meta.defaultLocation(snapshot.originCity, snapshot.destinationCity)
        );
      })
    );
  }

  if (completedStatuses.has(CHECKPOINT_STATUS.SELESAI)) {
    // Update shipment and insert tracking event in parallel
    await Promise.all([
      db.query(
        `UPDATE shipin_shipments
         SET shipment_status = 'SAMPAI', item_status = 'SELESAI', delivered_at = COALESCE(delivered_at, NOW())
         WHERE resi_code = $1 AND shipment_status <> 'SAMPAI'`,
        [snapshot.resi]
      ),
      db.query(
        `INSERT INTO shipin_tracking_events (shipment_id, event_status, description, location_label, lat, lng, occurred_at)
         SELECT s.id, 'Terkirim', 'Paket telah tiba di tujuan.', $2, s.koordinat_tujuan_lat, s.koordinat_tujuan_lng, NOW()
         FROM shipin_shipments s
         WHERE s.resi_code = $1
         AND NOT EXISTS (SELECT 1 FROM shipin_tracking_events te WHERE te.shipment_id = s.id AND te.event_status = 'Terkirim')`,
        [snapshot.resi, snapshot.destinationCity]
      )
    ]);
  }
}
