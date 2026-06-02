import { estimateShippingCost, resolveAreaCoordinate } from "@/lib/shipping-pricing";

export type ShipmentStatus = "DALAM PERJALANAN" | "DIJADWALKAN" | "SAMPAI" | "SELESAI";
export type PaymentStatus = "LUNAS" | "BELUM BAYAR";
export type ServiceType = "REGULER" | "EKSPRES";

export type TrackingStatus =
  | "Pesanan diterima"
  | "Diproses di warehouse"
  | "Berangkat dari hub"
  | "Tiba di transit"
  | "Sedang dikirim"
  | "Terkirim";

export type TrackingEvent = {
  id: string;
  status: TrackingStatus;
  description: string;
  locationLabel: string;
  lat: number;
  lng: number;
  occurredAt: number;
};

export type ShipmentRecord = {
  id: string;
  uuid?: string;
  type: string;
  itemName?: string;
  itemCategory?: string;
  sender: string;
  receiver: string;
  destination: string;
  date: string;
  payment: PaymentStatus;
  shipment: ShipmentStatus;
  itemStatus?: string;
  itemNote?: string;
  total: number;
  createdAt: number;
  senderAddress?: string;
  receiverAddress?: string;
  originProvince?: string;
  destinationProvince?: string;
  originCity?: string;
  destinationCity?: string;
  senderPhone?: string;
  receiverPhone?: string;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  service?: ServiceType;
  vehicleId?: number | null;
  vehicleName?: string;
  vehicleType?: string;
  plateNumber?: string;
  vehicleCapacityKg?: number;
  vehicleStatus?: string;
  estimatedArrivalAt?: number;
  deliveredAt?: number;
  latestLocationLabel?: string;
  latestLat?: number;
  latestLng?: number;
  trackingEvents?: TrackingEvent[];
  lastTrackingUpdateAt?: number;
  // Coordinate columns for accurate map display
  koordinatAsalLat?: number | null;
  koordinatAsalLng?: number | null;
  koordinatTujuanLat?: number | null;
  koordinatTujuanLng?: number | null;
  waktuBerangkat?: number | null;
  durasiEstimasiMs?: number | null;
};

export type CreateShipmentPayload = {
  senderName: string;
  pickupAddress: string;
  receiverName: string;
  destinationAddress: string;
  originProvince?: string;
  destinationProvince?: string;
  originCity?: string;
  destinationCity?: string;
  originPostalCode?: string;
  destinationPostalCode?: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  senderPhone?: string;
  receiverPhone?: string;
  weightKg: number;
  service: ServiceType;
  itemName: string;
  itemCategory: string;
  itemNote?: string;
  deliveryType?: "BIASA" | "CEPAT" | "VVIP";
  vehicleId?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  waktuBerangkat?: number;
  durasiEstimasiMs?: number;
};

export type VehicleOption = {
  id: number;
  vehicle_name: string;
  vehicle_type: string;
  plate_number: string;
  capacity_kg: string;
  vehicle_status: string;
  hub_name: string;
  city: string;
};

const STORAGE_KEY = "shipin_admin_shipments_v1";

const TRACKING_STATUSES: TrackingStatus[] = [
  "Pesanan diterima",
  "Diproses di warehouse",
  "Berangkat dari hub",
  "Tiba di transit",
  "Sedang dikirim",
  "Terkirim"
];

type Waypoint = {
  label: string;
  lat: number;
  lng: number;
};

const SEED_SHIPMENTS: ShipmentRecord[] = [
  {
    id: "SPG-99281-ID",
    type: "EKSPRES",
    sender: "Budi Santoso",
    receiver: "Siti Aminah",
    destination: "Jakarta | Surabaya",
    date: "12 Okt 2023",
    payment: "LUNAS",
    shipment: "DALAM PERJALANAN",
    total: 1450000,
    createdAt: 1697068800000,
    senderAddress: "Jakarta",
    receiverAddress: "Surabaya",
    originProvince: "DKI Jakarta",
    destinationProvince: "Jawa Timur",
    originCity: "Kota Jakarta Pusat",
    destinationCity: "Kota Surabaya",
    weightKg: 2.5,
    service: "EKSPRES",
    senderPhone: "081200000001",
    receiverPhone: "081300000001"
  },
  {
    id: "SPG-88172-ID",
    type: "REGULER",
    sender: "UD Maju Jaya",
    receiver: "PT Logistik",
    destination: "Bandung | Medan",
    date: "10 Okt 2023",
    payment: "BELUM BAYAR",
    shipment: "DIJADWALKAN",
    total: 5200000,
    createdAt: 1696896000000,
    senderAddress: "Bandung",
    receiverAddress: "Medan",
    originProvince: "Jawa Barat",
    destinationProvince: "Sumatera Utara",
    originCity: "Kota Bandung",
    destinationCity: "Kota Medan",
    weightKg: 6.4,
    service: "REGULER",
    senderPhone: "081200000002",
    receiverPhone: "081300000002"
  }
];

function canUseStorage() {
  return typeof window !== "undefined";
}

function normalizeResi(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .trim();
}

function parseDestination(pickupAddress: string, destinationAddress: string) {
  const start = pickupAddress.split(",")[0]?.trim() || "Asal";
  const end = destinationAddress.split(",")[0]?.trim() || "Tujuan";
  return `${start} | ${end}`;
}

function getPrimaryArea(text: string) {
  const tokens = text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!tokens.length) return "Indonesia";
  if (tokens.length >= 3) return tokens[tokens.length - 3];
  return tokens[0];
}

function makeId() {
  const tail = String(Date.now()).slice(-6);
  return `SPG-${tail}-ID`;
}

function getTransitPoint(origin: Waypoint, destination: Waypoint): Waypoint {
  return {
    label: `Transit ${destination.label}`,
    lat: Number(((origin.lat + destination.lat) / 2).toFixed(5)),
    lng: Number(((origin.lng + destination.lng) / 2).toFixed(5))
  };
}

export function getWaypointsFromShipment(row: ShipmentRecord) {
  const senderArea =
    row.originCity ||
    getPrimaryArea(row.senderAddress || row.destination.split("|")[0] || "Jakarta");
  const receiverArea =
    row.destinationCity ||
    getPrimaryArea(row.receiverAddress || row.destination.split("|")[1] || "Bekasi");
  const originCoord = resolveAreaCoordinate({
    city: row.originCity || senderArea,
    province: row.originProvince
  });
  const destinationCoord = resolveAreaCoordinate({
    city: row.destinationCity || receiverArea,
    province: row.destinationProvince
  });
  return {
    senderArea,
    receiverArea,
    origin: { label: senderArea, ...originCoord } as Waypoint,
    destination: { label: receiverArea, ...destinationCoord } as Waypoint
  };
}

function inferProgressFromShipmentStatus(status: ShipmentStatus) {
  if (status === "SAMPAI" || status === "SELESAI") return TRACKING_STATUSES.length - 1;
  if (status === "DALAM PERJALANAN") return 4;
  return 1;
}

function deriveShipmentStatusFromProgress(progress: number): ShipmentStatus {
  if (progress >= TRACKING_STATUSES.length - 1) return "SAMPAI";
  if (progress >= 2) return "DALAM PERJALANAN";
  return "DIJADWALKAN";
}

function createBaseTrackingEvents(
  id: string,
  createdAt: number,
  origin: Waypoint,
  destination: Waypoint
) {
  const transit = getTransitPoint(origin, destination);
  const route: Array<{
    status: TrackingStatus;
    description: string;
    location: Waypoint;
  }> = [
    {
      status: "Pesanan diterima",
      description: "Pesanan telah dipindai dan masuk dalam sistem manifest utama.",
      location: origin
    },
    {
      status: "Diproses di warehouse",
      description: "Sortir paket berdasarkan wilayah tujuan selesai dilakukan.",
      location: {
        label: `${origin.label} Warehouse`,
        lat: origin.lat,
        lng: origin.lng
      }
    },
    {
      status: "Berangkat dari hub",
      description: "Paket berangkat dari hub asal menuju fasilitas transit resmi.",
      location: {
        label: `${origin.label} Hub`,
        lat: origin.lat + 0.02,
        lng: origin.lng + 0.02
      }
    },
    {
      status: "Tiba di transit",
      description: "Paket tiba di pusat transit dan siap diteruskan ke area tujuan.",
      location: transit
    },
    {
      status: "Sedang dikirim",
      description: "Kurir sedang mengantar paket ke alamat penerima.",
      location: {
        label: `Area ${destination.label}`,
        lat: destination.lat - 0.015,
        lng: destination.lng - 0.015
      }
    },
    {
      status: "Terkirim",
      description: "Paket telah diterima oleh penerima dengan kondisi baik.",
      location: destination
    }
  ];

  return route.map((event, index) => ({
    id: `${id}-EV-${index + 1}`,
    status: event.status,
    description: event.description,
    locationLabel: event.location.label,
    lat: Number(event.location.lat.toFixed(5)),
    lng: Number(event.location.lng.toFixed(5)),
    occurredAt: createdAt + index * 45 * 60 * 1000
  }));
}

function enrichShipment(row: ShipmentRecord): ShipmentRecord {
  const { senderArea, receiverArea, origin, destination } = getWaypointsFromShipment(row);
  const allEvents = createBaseTrackingEvents(row.id, row.createdAt, origin, destination);

  let progress = inferProgressFromShipmentStatus(row.shipment);
  if (row.trackingEvents?.length) {
    progress = Math.max(progress, row.trackingEvents.length - 1);
  }
  progress = Math.min(progress, allEvents.length - 1);
  const activeEvents = allEvents.slice(0, progress + 1);
  const latest = activeEvents[activeEvents.length - 1];
  const estimatedArrivalAt =
    row.estimatedArrivalAt ??
    (row.createdAt +
      (row.service === "EKSPRES" ? 24 : 72) * 60 * 60 * 1000);

  return {
    ...row,
    senderAddress: row.senderAddress || senderArea,
    receiverAddress: row.receiverAddress || receiverArea,
    service: row.service || (row.type === "EKSPRES" ? "EKSPRES" : "REGULER"),
    weightKg: row.weightKg ?? 1,
    trackingEvents: activeEvents,
    latestLocationLabel: latest.locationLabel,
    latestLat: latest.lat,
    latestLng: latest.lng,
    lastTrackingUpdateAt: latest.occurredAt,
    estimatedArrivalAt,
    shipment: deriveShipmentStatusFromProgress(progress),
    payment: row.payment
  };
}

function migrateRows(rows: ShipmentRecord[]) {
  return rows.map((row) => enrichShipment(row));
}

export function formatShipmentDate(time: number) {
  return new Date(time).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function formatDateTime(time: number) {
  return new Date(time).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function loadShipments() {
  if (!canUseStorage()) return migrateRows([...SEED_SHIPMENTS]);

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = migrateRows(SEED_SHIPMENTS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as ShipmentRecord[];
    if (!Array.isArray(parsed)) return migrateRows([...SEED_SHIPMENTS]);
    const migrated = migrateRows(parsed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return migrateRows([...SEED_SHIPMENTS]);
  }
}

export function saveShipments(rows: ShipmentRecord[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function createShipment(payload: CreateShipmentPayload) {
  const now = Date.now();
  const safeWeight = Math.max(1, payload.weightKg);
  const originCity = payload.originCity || getPrimaryArea(payload.pickupAddress);
  const destinationCity = payload.destinationCity || getPrimaryArea(payload.destinationAddress);
  const originProvince = payload.originProvince || "Indonesia";
  const destinationProvince = payload.destinationProvince || "Indonesia";
  const pricing = estimateShippingCost({
    originCity,
    destinationCity,
    originProvince,
    destinationProvince,
    weightKg: safeWeight,
    lengthCm: payload.lengthCm,
    widthCm: payload.widthCm,
    heightCm: payload.heightCm,
    service: payload.service
  });

  const next: ShipmentRecord = enrichShipment({
    id: makeId(),
    type: payload.service,
    sender: payload.senderName,
    receiver: payload.receiverName,
    destination: parseDestination(payload.pickupAddress, payload.destinationAddress),
    date: formatShipmentDate(now),
    payment: "BELUM BAYAR",
    shipment: "DIJADWALKAN",
    total: pricing.total,
    createdAt: now,
    senderAddress: payload.pickupAddress,
    receiverAddress: payload.destinationAddress,
    originProvince,
    destinationProvince,
    originCity,
    destinationCity,
    senderPhone: payload.senderPhone,
    receiverPhone: payload.receiverPhone,
    weightKg: safeWeight,
    service: payload.service
  });

  const current = loadShipments();
  const updated = [next, ...current];
  saveShipments(updated);
  return next;
}

export function updateShipment(id: string, patch: Partial<ShipmentRecord>) {
  const current = loadShipments();
  const updated = current.map((row) => {
    if (row.id !== id) return row;

    const merged = { ...row, ...patch };
    const desiredProgress = patch.shipment
      ? inferProgressFromShipmentStatus(patch.shipment)
      : (merged.trackingEvents?.length || 1) - 1;
    const base = enrichShipment(merged);
    const { origin, destination } = getWaypointsFromShipment(base);
    const allEvents = createBaseTrackingEvents(base.id, base.createdAt, origin, destination);
    const clippedProgress = Math.min(Math.max(0, desiredProgress), allEvents.length - 1);
    const activeEvents = allEvents.slice(0, clippedProgress + 1);
    const latest = activeEvents[activeEvents.length - 1];

    return {
      ...base,
      trackingEvents: activeEvents,
      latestLocationLabel: latest.locationLabel,
      latestLat: latest.lat,
      latestLng: latest.lng,
      lastTrackingUpdateAt: latest.occurredAt,
      shipment: deriveShipmentStatusFromProgress(clippedProgress),
      payment: patch.payment || base.payment
    };
  });
  saveShipments(updated);
  return updated;
}

export function deleteShipment(id: string) {
  const current = loadShipments();
  const updated = current.filter((row) => row.id !== id);
  saveShipments(updated);
  return updated;
}

export function findShipmentByResi(resi: string) {
  const keyword = normalizeResi(resi);
  if (!keyword) return null;
  const rows = loadShipments();
  const exact = rows.find((row) => normalizeResi(row.id) === keyword);
  if (exact) return exact;
  return rows.find((row) => normalizeResi(row.id).includes(keyword)) ?? null;
}

export function getShipmentStorageKey() {
  return STORAGE_KEY;
}

export function refreshTrackingProgress() {
  const rows = loadShipments();
  const now = Date.now();
  let changed = false;

  const updated = rows.map((row) => {
    const events = row.trackingEvents || [];
    const currentProgress = Math.max(0, events.length - 1);
    const elapsedSeconds = Math.max(0, Math.floor((now - row.createdAt) / 1000));
    const targetProgress = Math.min(TRACKING_STATUSES.length - 1, Math.floor(elapsedSeconds / 30));

    if (targetProgress <= currentProgress) return row;

    const base = enrichShipment(row);
    const { origin, destination } = getWaypointsFromShipment(base);
    const allEvents = createBaseTrackingEvents(base.id, base.createdAt, origin, destination);
    const activeEvents = allEvents.slice(0, targetProgress + 1);
    const latest = activeEvents[activeEvents.length - 1];
    changed = true;

    return {
      ...base,
      trackingEvents: activeEvents,
      latestLocationLabel: latest.locationLabel,
      latestLat: latest.lat,
      latestLng: latest.lng,
      lastTrackingUpdateAt: latest.occurredAt,
      shipment: deriveShipmentStatusFromProgress(targetProgress),
      payment: targetProgress >= 2 ? "LUNAS" : base.payment
    };
  });

  if (changed) {
    saveShipments(updated);
  }

  return updated;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  let data: unknown = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw.slice(0, 180) || "Respons server tidak valid." };
    }
  }

  if (!response.ok) {
    throw new Error((data as { message?: string } | null)?.message || "Request database gagal.");
  }
  return data as T;
}

export async function fetchShipmentsFromDatabase(search = "") {
  const response = await fetch(`/api/shipments?search=${encodeURIComponent(search)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000)
  });
  const data = await parseJsonResponse<{ shipments: ShipmentRecord[] }>(response);
  return data.shipments;
}

export async function runProgressCheck() {
  const response = await fetch("/api/cek-progress", {
    cache: "no-store",
    signal: AbortSignal.timeout(8000)
  });
  return parseJsonResponse<{ ok: boolean; checked: number; updated: number }>(response);
}

export async function fetchTrackingByResi(resi: string) {
  const response = await fetch(`/api/lacak?resi=${encodeURIComponent(resi)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000)
  });
  return parseJsonResponse<{
    shipment: ShipmentRecord | null;
    checkpoints: CheckpointRecord[];
  }>(response);
}

export async function fetchVehiclesFromDatabase() {
  const response = await fetch("/api/vehicles", {
    cache: "no-store",
    signal: AbortSignal.timeout(8000)
  });
  const data = await parseJsonResponse<{ vehicles: VehicleOption[] }>(response);
  return data.vehicles;
}

export async function createShipmentInDatabase(payload: CreateShipmentPayload) {
  const response = await fetch("/api/shipments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      senderName: payload.senderName,
      senderPhone: payload.senderPhone,
      receiverName: payload.receiverName,
      receiverPhone: payload.receiverPhone,
      originProvince: payload.originProvince,
      originCity: payload.originCity,
      originPostalCode: payload.originPostalCode,
      originAddress: payload.pickupAddress,
      destinationProvince: payload.destinationProvince,
      destinationCity: payload.destinationCity,
      destinationPostalCode: payload.destinationPostalCode,
      destinationAddress: payload.destinationAddress,
      weightKg: payload.weightKg,
      lengthCm: payload.lengthCm,
      widthCm: payload.widthCm,
      heightCm: payload.heightCm,
      service: payload.service,
      deliveryType: payload.deliveryType || (payload.service === "EKSPRES" ? "CEPAT" : "BIASA"),
      packageType: payload.itemCategory || "Barang Cargo",
      itemName: payload.itemName,
      itemCategory: payload.itemCategory,
      itemNote: payload.itemNote || "",
      vehicleId: payload.vehicleId,
      totalAmount: estimateShippingCost({
        originCity: payload.originCity || "",
        destinationCity: payload.destinationCity || "",
        originProvince: payload.originProvince || "Indonesia",
        destinationProvince: payload.destinationProvince || "Indonesia",
        weightKg: payload.weightKg,
        lengthCm: payload.lengthCm,
        widthCm: payload.widthCm,
        heightCm: payload.heightCm,
        service: payload.service
      }).total,
      originLat: payload.originLat,
      originLng: payload.originLng,
      destinationLat: payload.destinationLat,
      destinationLng: payload.destinationLng,
      waktuBerangkat: payload.waktuBerangkat,
      durasiEstimasiMs: payload.durasiEstimasiMs
    })
  });
  const data = await parseJsonResponse<{ shipment: ShipmentRecord }>(response);
  return data.shipment;
}

export async function updateShipmentInDatabase(id: string, patch: Partial<ShipmentRecord>) {
  const response = await fetch(`/api/shipments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify(patch)
  });
  await parseJsonResponse<{ ok: boolean }>(response);
  return fetchShipmentsFromDatabase();
}

export async function deleteShipmentFromDatabase(id: string) {
  const response = await fetch(`/api/shipments/${encodeURIComponent(id)}`, {
    method: "DELETE",
    signal: AbortSignal.timeout(15000)
  });
  await parseJsonResponse<{ ok: boolean }>(response);
  return fetchShipmentsFromDatabase();
}

/**
 * Checkpoint types for shipment tracking history.
 */
export type CheckpointRecord = {
  id: number;
  resi_id: string;
  waktu: Date;
  status: string;
  deskripsi: string | null;
  lokasi: string | null;
};

/**
 * Fetch checkpoint/riwayat data for a shipment.
 * Uses API route for consistency.
 */
export async function fetchCheckpointsByResi(resi: string) {
  const response = await fetch(`/api/checkpoints?resi=${encodeURIComponent(resi)}`, {
    cache: "no-store"
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.checkpoints || [];
}

/**
 * Geocode an address using Nominatim OpenStreetMap.
 * Returns { lat, lng } or null if not found.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address?.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&accept-language=id`;
    const response = await fetch(url, {
      headers: { "User-Agent": "SHIPINGO/1.0" },
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) return null;
    const results = await response.json();
    if (results && results.length > 0) {
      return {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon)
      };
    }
    return null;
  } catch {
    return null;
  }
}
