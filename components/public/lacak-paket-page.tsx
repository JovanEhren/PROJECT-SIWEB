"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, ErrorInfo, ReactNode, useEffect, useMemo, useState } from "react";

import {
  CalendarIcon,
  ChatBubbleIcon,
  CheckIcon,
  HistoryIcon,
  PackageIcon,
  SearchIcon
} from "@/components/icons";
import {
  CheckpointRecord,
  fetchTrackingByResi,
  formatDateTime,
  formatShipmentDate,
  runProgressCheck,
  ShipmentRecord
} from "@/lib/admin-shipments";
import {
  CHECKPOINT_SEQUENCE,
  formatCheckpointTime,
  getCheckpointLabel,
  getCheckpointOrder
} from "@/lib/utils/checkpoint-shared";

const TrackingMap = dynamic(
  () => import("@/components/public/tracking-map").then((mod) => mod.TrackingMap),
  { ssr: false }
);

type TrackingMapBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type TrackingMapBoundaryState = {
  hasError: boolean;
};

class TrackingMapBoundary extends Component<
  TrackingMapBoundaryProps,
  TrackingMapBoundaryState
> {
  state: TrackingMapBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function normalizeResiInput(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, "").trim();
}

function parseOriginDestination(shipment: ShipmentRecord) {
  const [originRaw, destinationRaw] = shipment.destination.split("|");
  return {
    origin: shipment.senderAddress || originRaw?.trim() || "Asal",
    destination: shipment.receiverAddress || destinationRaw?.trim() || "Tujuan"
  };
}

function getCurrentStatus(shipment: ShipmentRecord) {
  const latest = shipment.trackingEvents?.[shipment.trackingEvents.length - 1];
  return latest?.status || "Pesanan diterima";
}

export function LacakPaketPage() {
  const [resiInput, setResiInput] = useState("");
  const [activeResi, setActiveResi] = useState("");
  const [isNotFound, setIsNotFound] = useState(false);
  const [rows, setRows] = useState<ShipmentRecord[]>([]);
  const [checkpoints, setCheckpoints] = useState<CheckpointRecord[]>([]);

  async function loadTracking(resi: string) {
    const data = await fetchTrackingByResi(resi);
    if (!data.shipment) {
      setRows([]);
      setActiveResi("");
      setIsNotFound(true);
      setCheckpoints([]);
      return;
    }

    setRows([data.shipment]);
    setActiveResi(data.shipment.id);
    setResiInput(data.shipment.id);
    setIsNotFound(false);
    setCheckpoints(
      (data.checkpoints || []).map((checkpoint) => ({
        ...checkpoint,
        waktu: new Date(checkpoint.waktu)
      }))
    );
  }

  useEffect(() => {
    let active = true;

    async function hydrate() {
      await runProgressCheck().catch(() => null);
      const params = new URLSearchParams(window.location.search);
      const resiFromQuery = normalizeResiInput(params.get("resi") || "");

      if (!resiFromQuery) {
        setRows([]);
        setActiveResi("");
        setResiInput("");
        setIsNotFound(false);
        setCheckpoints([]);
        return;
      }

      if (!active) return;
      try {
        const data = await fetchTrackingByResi(resiFromQuery);
        if (!active) return;
        if (!data.shipment) {
          setRows([]);
          setActiveResi("");
          setResiInput(resiFromQuery);
          setIsNotFound(true);
          setCheckpoints([]);
          return;
        }

        setRows([data.shipment]);
        setActiveResi(data.shipment.id);
        setResiInput(data.shipment.id);
        setIsNotFound(false);
        setCheckpoints(
          (data.checkpoints || []).map((checkpoint) => ({
            ...checkpoint,
            waktu: new Date(checkpoint.waktu)
          }))
        );
      } catch {
        if (active) {
          setIsNotFound(true);
        }
      }
    }

    hydrate().catch(() => setIsNotFound(true));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!activeResi) {
      setCheckpoints([]);
      return;
    }

    const interval = window.setInterval(async () => {
      const data = await fetchTrackingByResi(activeResi).catch(() => null);
      if (!data?.shipment) return;
      setRows([data.shipment]);
      setCheckpoints(
        (data.checkpoints || []).map((checkpoint) => ({
          ...checkpoint,
          waktu: new Date(checkpoint.waktu)
        }))
      );
    }, 10000);

    return () => window.clearInterval(interval);
  }, [activeResi]);

  const activeShipment = useMemo(() => {
    if (!activeResi) return null;
    return rows.find((row) => row.id === activeResi) || null;
  }, [activeResi, rows]);

  const checkpointTimeline = useMemo(() => {
    const latestByStatus = new Map<string, (typeof checkpoints)[number]>();
    checkpoints.forEach((checkpoint) => {
      if (!latestByStatus.has(checkpoint.status)) {
        latestByStatus.set(checkpoint.status, checkpoint);
      }
    });

    return [...CHECKPOINT_SEQUENCE]
      .sort((a, b) => getCheckpointOrder(b) - getCheckpointOrder(a))
      .map((status) => {
        const checkpoint = latestByStatus.get(status);
        return {
          status,
          completed: Boolean(checkpoint),
          waktu: checkpoint?.waktu ?? null,
          deskripsi: checkpoint?.deskripsi ?? "Belum ada update untuk checkpoint ini.",
          lokasi: checkpoint?.lokasi ?? null
        };
      });
  }, [checkpoints]);

  const locationInfo = useMemo(() => {
    if (!activeShipment) return null;
    const { origin, destination } = parseOriginDestination(activeShipment);
    return {
      origin,
      destination,
      latestLabel: activeShipment.latestLocationLabel || destination,
      latestLat: activeShipment.latestLat,
      latestLng: activeShipment.latestLng
    };
  }, [activeShipment]);

  async function handleSearch() {
    const normalized = normalizeResiInput(resiInput);
    if (!normalized) return;
    await runProgressCheck().catch(() => null);
    await loadTracking(normalized);
  }

  return (
    <main>
      <section className="shell py-10 lg:py-14">
        <div className="mx-auto max-w-[1000px]">
          <div className="">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b918b]">
              Status Terkini
            </p>
            <h1 className="mt-1 text-[34px] font-extrabold tracking-[-0.03em] text-[#1f2622] sm:text-[48px]">
              Lacak Paket Anda
            </h1>
            <p className="mt-2 max-w-[520px] text-[14px] leading-6 text-[#6d746e] sm:text-[16px]">
              Informasi real-time perjalanan logistik Anda dengan akurasi tinggi.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2 rounded-[18px] border border-[#e3e8e2] bg-white p-3 sm:flex-row sm:items-center">
            <input
              value={resiInput}
              onChange={(event) => setResiInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Masukkan nomor resi, contoh: SPG-123456-ID"
              className="h-11 flex-1 rounded-full border border-[#dbe3da] bg-[#f8faf7] px-4 text-[14px] text-[#27342b] outline-none placeholder:text-[#95a095]"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-shipin-deep px-6 text-sm font-semibold text-white hover:bg-[#12572f]"
            >
              <SearchIcon className="h-4 w-4" />
              Cari Resi
            </button>
          </div>

          {isNotFound ? (
            <div className="mt-4 rounded-[16px] border border-[#f0d6d6] bg-[#fff4f4] px-4 py-3 text-[13px] font-semibold text-[#bf3b3b]">
              Nomor resi tidak ditemukan
            </div>
          ) : null}

          {!activeShipment ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-[#d9e1d8] bg-[#f8faf7] px-5 py-8 text-center">
              <p className="text-[16px] font-bold text-[#314036]">Masukkan nomor resi untuk mulai melacak</p>
              <p className="mt-2 text-[13px] text-[#748076]">
                Data pengiriman akan muncul setelah nomor resi yang valid dicari.
              </p>
            </div>
          ) : (
            <div className="mt-7 grid gap-5 lg:items-start lg:grid-cols-[0.9fr_1.1fr]">
              <article className="hover-lift rounded-[28px] border border-[#e5eae3] bg-[#f9faf8] p-5 shadow-[0_18px_34px_rgba(174,183,169,0.18)]">
                <div className="rounded-[16px] border border-[#e3e8e1] bg-white px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#95a090]">
                      Nomor Resi
                    </p>
                    <span className="rounded-full bg-[#d9f6d6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#1b8248]">
                      {getCurrentStatus(activeShipment)}
                    </span>
                  </div>
                  <p className="mt-2 text-[26px] font-extrabold leading-none tracking-[-0.02em] text-[#1e5f38]">
                    {activeShipment.id}
                  </p>

                  <div className="mt-4 rounded-[14px] border border-[#e7eee7] bg-[#f5faf4] px-3 py-3">
                    <div className="flex items-center gap-2 text-[#2d6d42]">
                      <CalendarIcon className="h-4 w-4" />
                      <p className="text-[11px] font-semibold">Estimasi Tiba</p>
                    </div>
                    <p className="mt-1 text-[13px] text-[#41544a]">
                      {formatShipmentDate(activeShipment.estimatedArrivalAt || activeShipment.createdAt)}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-[12px] bg-[#f2f4ef] px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-[#8c958d]">Asal</p>
                      <p className="mt-1 text-[12px] font-semibold text-[#35443a]">
                        {locationInfo?.origin}
                      </p>
                    </div>
                    <div className="rounded-[12px] bg-[#f2f4ef] px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-[#8c958d]">Tujuan</p>
                      <p className="mt-1 text-[12px] font-semibold text-[#35443a]">
                        {locationInfo?.destination}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[14px] border border-[#e4e8e2] bg-white px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#8b928b]">Berat</p>
                    <p className="mt-1 text-[14px] font-bold text-[#2d3a31]">
                      {(activeShipment.weightKg || 0).toFixed(2)} kg
                    </p>
                  </div>
                  <div className="rounded-[14px] border border-[#e4e8e2] bg-white px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#8b928b]">Layanan</p>
                    <p className="mt-1 text-[14px] font-bold text-[#2d3a31]">
                      {activeShipment.service || activeShipment.type}
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-[18px] border border-[#e0e6df] bg-[#dce8dd]">
                  <TrackingMapBoundary
                    fallback={
                      <div className="h-[220px] bg-[linear-gradient(135deg,#6a8b7c_0%,#b8d7bf_46%,#7ca19b_100%)] opacity-85" />
                    }
                  >
                    <TrackingMap
                      origin={
                        activeShipment.koordinatAsalLat != null && activeShipment.koordinatAsalLng != null
                          ? { lat: activeShipment.koordinatAsalLat, lng: activeShipment.koordinatAsalLng, label: locationInfo?.origin || "Asal" }
                          : activeShipment.trackingEvents?.[0]
                          ? { lat: activeShipment.trackingEvents[0].lat, lng: activeShipment.trackingEvents[0].lng, label: locationInfo?.origin || "Asal" }
                          : null
                      }
                      destination={
                        activeShipment.koordinatTujuanLat != null && activeShipment.koordinatTujuanLng != null
                          ? { lat: activeShipment.koordinatTujuanLat, lng: activeShipment.koordinatTujuanLng, label: locationInfo?.destination || "Tujuan" }
                          : activeShipment.trackingEvents?.length
                          ? { lat: activeShipment.trackingEvents[activeShipment.trackingEvents.length - 1].lat, lng: activeShipment.trackingEvents[activeShipment.trackingEvents.length - 1].lng, label: locationInfo?.destination || "Tujuan" }
                          : null
                      }
                      latest={
                        locationInfo?.latestLat != null && locationInfo?.latestLng != null
                          ? { lat: locationInfo.latestLat, lng: locationInfo.latestLng, label: locationInfo.latestLabel || "Posisi paket" }
                          : null
                      }
                      waktuBerangkat={activeShipment.waktuBerangkat ?? null}
                      durasiEstimasiMs={activeShipment.durasiEstimasiMs ?? null}
                      heightClassName="h-[220px]"
                    />
                  </TrackingMapBoundary>
                  <div className="flex items-center gap-2 border-t border-[#d2ded1] bg-[#f4f8f3] px-3 py-2 text-[11px] text-[#4f5b52]">
                    <CheckIcon className="h-3.5 w-3.5 text-[#1f8f4e]" />
                    Rute: {locationInfo?.origin} → {locationInfo?.destination}
                  </div>
                </div>
              </article>

              <article className="hover-lift rounded-[28px] border border-[#e5eae3] bg-[#f9faf8] p-5 shadow-[0_18px_34px_rgba(174,183,169,0.18)]">
                <div className="flex items-center gap-2 text-[#2f3933]">
                  <HistoryIcon className="h-4 w-4" />
                  <h2 className="text-[20px] font-bold">Riwayat Perjalanan</h2>
                </div>

                <div className="mt-3 rounded-[12px] border border-[#e5ece5] bg-white px-3 py-2 text-[12px] text-[#5e6a61]">
                  Update terakhir: {formatDateTime(activeShipment.lastTrackingUpdateAt || activeShipment.createdAt)}
                </div>

                <div className="relative mt-5 pl-7">
                  <div className="absolute bottom-2 left-[9px] top-2 w-[2px] bg-[#dce8db]" />
                  <div className="space-y-4">
                    {checkpointTimeline.map((item) => (
                      <div key={item.status} className="relative">
                        <span
                          className={`absolute -left-[26px] top-2 h-4 w-4 rounded-full border-2 ${
                            item.completed
                              ? "border-[#219754] bg-[#219754]"
                              : "border-[#c8d0ca] bg-[#eef1ef]"
                          }`}
                        />
                        <div
                          className={`rounded-[14px] border px-4 py-3 ${
                            item.completed
                              ? "border-[#d6ead8] bg-white shadow-[0_10px_20px_rgba(144,177,150,0.16)]"
                              : "border-[#e7ece7] bg-[#f7f9f7]"
                          }`}
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#95a190]">
                            {item.waktu ? formatCheckpointTime(item.waktu) : "MENUNGGU UPDATE"}
                          </p>
                          <p className="mt-1 text-[17px] font-bold tracking-[-0.01em] text-[#303a33]">
                            {getCheckpointLabel(item.status)}
                          </p>
                          <p className="mt-1 text-[12px] leading-5 text-[#6a746d]">{item.deskripsi}</p>
                          <p className="mt-1 text-[11px] font-semibold text-[#4b5a50]">
                            Lokasi: {item.lokasi || "-"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 rounded-[20px] border border-[#dff0df] bg-[#ebf9ea] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#9ff0aa] text-[#187e43]">
                <ChatBubbleIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[16px] font-bold text-[#2d3a31]">Ada masalah dengan paket?</p>
                <p className="text-[12px] text-[#677367]">Tim bantuan kami siap membantu Anda 24/7.</p>
              </div>
            </div>
            <Link
              href="/kontak"
              className="inline-flex h-11 items-center justify-center rounded-full bg-shipin-deep px-6 text-sm font-semibold text-white hover:bg-[#12572f]"
            >
              Hubungi Kami
            </Link>
          </div>
        </div>
      </section>

      <footer id="kontak" className="mt-8 bg-white/85">
        <div className="shell py-12">
          <div className="grid gap-10 border-b border-[#e8ebe4] pb-10 md:grid-cols-2 lg:grid-cols-[1.4fr_0.7fr_0.7fr]">
            <div>
              <p className="text-[18px] font-extrabold tracking-[-0.03em] text-shipin-deep">SHIPIN GO</p>
              <p className="mt-5 max-w-[360px] text-[15px] leading-8 text-shipin-text">
                Solusi logistik terdepan di Indonesia. Menghubungkan orang dan bisnis
                melalui sistem pengiriman yang cerdas dan efisien.
              </p>
            </div>
            <div>
              <p className="text-[15px] font-bold text-shipin-ink">Perusahaan</p>
              <ul className="mt-5 space-y-4 text-[15px] text-shipin-text">
                <li>Tentang Kami</li>
                <li>Karir</li>
                <li>Kontak</li>
              </ul>
            </div>
            <div>
              <p className="text-[15px] font-bold text-shipin-ink">Dukungan</p>
              <ul className="mt-5 space-y-4 text-[15px] text-shipin-text">
                <li>Pusat Bantuan</li>
                <li>Syarat &amp; Ketentuan</li>
                <li>Kebijakan Privasi</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-4 pt-7 text-[14px] text-shipin-text sm:flex-row sm:items-center sm:justify-between">
            <p>© 2024 SHIPIN GO. Hak Cipta Dilindungi.</p>
            <div className="flex gap-6">
              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="hover:text-shipin-deep">
                Instagram
              </a>
              <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" className="hover:text-shipin-deep">
                LinkedIn
              </a>
              <a href="https://x.com/" target="_blank" rel="noreferrer" className="hover:text-shipin-deep">
                Twitter
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
