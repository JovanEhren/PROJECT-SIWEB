"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

// =============================================
// GOJEK-STYLE REAL-TIME TRACKING MAP
// =============================================

type MapPoint = {
  lat: number;
  lng: number;
  label: string;
};

type TrackingMapProps = {
  origin?: MapPoint | null;
  destination?: MapPoint | null;
  latest?: MapPoint | null;
  waktuBerangkat?: number | null;
  durasiEstimasiMs?: number | null;
  heightClassName?: string;
  zoom?: number;
  scrollWheelZoom?: boolean;
};

// ---- Origin Pin (Blue teardrop) ----
const originIcon = L.divIcon({
  className: "shipin-origin-pin",
  html: `<div style="
    width:28px;height:34px;
    background:#2563eb;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:3px solid #fff;
    box-shadow:0 4px 12px rgba(37,99,235,0.5);
    position:relative;
  ">
    <div style="
      position:absolute;
      top:50%;left:50%;
      transform:translate(-50%,-50%) rotate(45deg);
      width:8px;height:8px;
      border-radius:50%;
      background:#fff;
    "></div>
  </div>`,
  iconSize: [28, 34],
  iconAnchor: [14, 34],
  popupAnchor: [1, -34]
});

// ---- Destination Pin (Green teardrop) ----
const destinationIcon = L.divIcon({
  className: "shipin-destination-pin",
  html: `<div style="
    width:28px;height:34px;
    background:#16a34a;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:3px solid #fff;
    box-shadow:0 4px 12px rgba(22,163,74,0.5);
    position:relative;
  ">
    <div style="
      position:absolute;
      top:50%;left:50%;
      transform:translate(-50%,-50%) rotate(45deg);
      width:8px;height:8px;
      border-radius:50%;
      background:#fff;
    "></div>
  </div>`,
  iconSize: [28, 34],
  iconAnchor: [14, 34],
  popupAnchor: [1, -34]
});

// ---- Animated Pulsing Marker (Orange) ----
const latestIcon = L.divIcon({
  className: "shipin-latest-pin",
  html: `<div style="
    width:36px;height:36px;
    position:relative;
  ">
    <!-- Pulse ring -->
    <div style="
      position:absolute;
      inset:-8px;
      border-radius:50%;
      background:rgba(249,115,22,0.25);
      animation:trackingPulse 1.8s ease-out infinite;
    "></div>
    <!-- Marker body -->
    <div style="
      position:relative;z-index:1;
      width:36px;height:36px;
      background:#f97316;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid #fff;
      box-shadow:0 4px 16px rgba(249,115,22,0.7);
      display:flex;align-items:center;justify-content:center;
    ">
      <svg style="transform:rotate(45deg)" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" width="16" height="16">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
      </svg>
    </div>
    <style>
      @keyframes trackingPulse {
        0% { transform:scale(0.7); opacity:1; }
        100% { transform:scale(2); opacity:0; }
      }
    </style>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [1, -36]
});

// ---- Auto-bounds to fit all markers ----
function AutoBounds({
  origin,
  destination,
  latest
}: {
  origin?: MapPoint | null;
  destination?: MapPoint | null;
  latest?: MapPoint | null;
}) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [];
    if (origin) points.push([origin.lat, origin.lng]);
    if (destination) points.push([destination.lat, destination.lng]);
    if (latest) points.push([latest.lat, latest.lng]);
    if (points.length > 0) {
      map.fitBounds(points as [number, number][], { padding: [60, 60] });
    }
  }, [map, origin, destination, latest]);
  return null;
}

export function TrackingMap({
  origin,
  destination,
  latest,
  waktuBerangkat,
  durasiEstimasiMs,
  heightClassName = "h-[380px]",
  zoom = 7,
  scrollWheelZoom = false
}: TrackingMapProps) {
  const isSimpleLocationMode = Boolean(latest && !origin && !destination);
  const [, forceUpdate] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Animated position along route ----
  const animatedPos = useMemo<MapPoint | null>(() => {
    if (!origin || !destination) return null;

    if (!waktuBerangkat || !durasiEstimasiMs || durasiEstimasiMs <= 0) {
      return {
        lat: (origin.lat + destination.lat) / 2,
        lng: (origin.lng + destination.lng) / 2,
        label: "Titik tengah rute"
      };
    }

    const elapsed = Date.now() - waktuBerangkat;
    const rawProgress = Math.max(0, Math.min(elapsed / durasiEstimasiMs, 1));
    // Ease-out cubic for natural deceleration
    const eased = 1 - Math.pow(1 - rawProgress, 3);

    return {
      lat: origin.lat + (destination.lat - origin.lat) * eased,
      lng: origin.lng + (destination.lng - origin.lng) * eased,
      label: rawProgress >= 1 ? "Paket telah sampai" : "Sedang dalam perjalanan"
    };
  }, [origin, destination, waktuBerangkat, durasiEstimasiMs]);

  // Update every 2 seconds for smooth animation
  useEffect(() => {
    if (!isSimpleLocationMode) {
      intervalRef.current = setInterval(() => {
        forceUpdate((n) => n + 1);
      }, 2000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSimpleLocationMode]);

  // ---- ETA text ----
  const etaText = useMemo<string>(() => {
    if (!waktuBerangkat || !durasiEstimasiMs || durasiEstimasiMs <= 0) {
      return "Estimasi tidak tersedia";
    }
    const elapsed = Date.now() - waktuBerangkat;
    const remaining = Math.max(0, durasiEstimasiMs - elapsed);
    if (remaining <= 0) return "Sudah sampai!";
    const mins = Math.ceil(remaining / 60000);
    if (mins < 60) return `${mins} menit`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hours}j ${remMins}m` : `${hours} jam`;
  }, [waktuBerangkat, durasiEstimasiMs]);

  // ---- Distance traveled percentage ----
  const distPercent = useMemo<number>(() => {
    if (!origin || !destination) return 0;
    if (!animatedPos) return 0;
    const totalLat = destination.lat - origin.lat;
    const totalLng = destination.lng - origin.lng;
    const totalDist = Math.sqrt(totalLat * totalLat + totalLng * totalLng);
    if (totalDist === 0) return 100;
    const traveledLat = animatedPos.lat - origin.lat;
    const traveledLng = animatedPos.lng - origin.lng;
    const traveledDist = Math.sqrt(traveledLat * traveledLat + traveledLng * traveledLng);
    return Math.min(100, Math.round((traveledDist / totalDist) * 100));
  }, [origin, destination, animatedPos]);

  // ---- Route polylines ----
  const traveledPoints = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = [];
    if (origin) pts.push([origin.lat, origin.lng]);
    if (animatedPos) pts.push([animatedPos.lat, animatedPos.lng]);
    return pts;
  }, [origin, animatedPos]);

  const remainingPoints = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = [];
    if (animatedPos) pts.push([animatedPos.lat, animatedPos.lng]);
    if (destination) pts.push([destination.lat, destination.lng]);
    return pts;
  }, [animatedPos, destination]);

  const fullRoute = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = [];
    if (origin) pts.push([origin.lat, origin.lng]);
    if (animatedPos) pts.push([animatedPos.lat, animatedPos.lng]);
    if (destination) pts.push([destination.lat, destination.lng]);
    return pts;
  }, [origin, animatedPos, destination]);

  return (
    <div className="relative" style={{ minHeight: heightClassName }}>
      <MapContainer
        center={
          origin
            ? [origin.lat, origin.lng]
            : latest
              ? [latest.lat, latest.lng]
              : [-2.5, 118]
        }
        zoom={zoom}
        scrollWheelZoom={scrollWheelZoom}
        className={`${heightClassName} w-full`}
        style={{ borderRadius: 0, minHeight: heightClassName }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AutoBounds origin={origin} destination={destination} latest={animatedPos || latest} />

        {/* Origin Marker */}
        {origin && (
          <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
            <Popup>
              <div className="text-center min-w-[140px]">
                <strong className="text-blue-600 text-sm">&#128205; Titik Awal</strong>
                <br />
                <span className="text-gray-700 text-xs">{origin.label}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <div className="text-center min-w-[140px]">
                <strong className="text-green-600 text-sm">&#127757; Tujuan</strong>
                <br />
                <span className="text-gray-700 text-xs">{destination.label}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Animated Vehicle Marker */}
        {(animatedPos || latest) && (
          <Marker
            position={[
              animatedPos?.lat ?? latest!.lat,
              animatedPos?.lng ?? latest!.lng
            ]}
            icon={latestIcon}
          >
            <Popup>
              <div className="text-center min-w-[160px]">
                <strong className="text-orange-500 text-sm">
                  &#128179; {animatedPos?.label || latest!.label}
                </strong>
                <br />
                {distPercent > 0 && (
                  <span className="text-gray-500 text-xs">
                    {distPercent}% dari perjalanan
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dashed grey route (remaining path) */}
        {remainingPoints.length > 1 && (
          <Polyline
            positions={remainingPoints}
            pathOptions={{ color: "#94a3b8", weight: 3, opacity: 0.4, dashArray: "8 8" }}
          />
        )}

        {/* Orange traveled route */}
        {traveledPoints.length > 1 && (
          <Polyline
            positions={traveledPoints}
            pathOptions={{ color: "#f97316", weight: 4, opacity: 0.9 }}
          />
        )}
      </MapContainer>

      {!isSimpleLocationMode ? (
        <>
          <div className="absolute top-3 left-3 z-[500] min-w-[160px] rounded-2xl border border-[#e5ebe5] bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm pointer-events-none">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" width="18" height="18">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#9ca39f] leading-none">
                  Estimasi Tiba
                </p>
                <p className="text-[15px] font-extrabold leading-tight text-[#f97316]">
                  {etaText}
                </p>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="mb-1 flex justify-between text-[9px] font-bold text-[#9ca39f]">
                <span>Awal</span>
                <span className="text-orange-500">{distPercent}%</span>
                <span>Tujuan</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#e5ebe5]">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${distPercent}%`,
                    background: distPercent >= 100
                      ? "linear-gradient(90deg, #22c55e, #16a34a)"
                      : "linear-gradient(90deg, #f97316, #fb923c)"
                  }}
                />
              </div>
            </div>
          </div>

          <div className="absolute bottom-3 right-3 z-[1000] rounded-2xl border border-[#e5ebe5] bg-white/95 px-3 py-2.5 shadow-xl backdrop-blur-sm">
            <p className="mb-2 text-[9px] font-extrabold uppercase tracking-widest text-[#9ca39f]">Legenda</p>
            <div className="mb-1.5 flex items-center gap-2">
              <div className="flex h-5 w-4 items-center justify-center rounded-sm bg-blue-600 shadow-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
              </div>
              <span className="text-[11px] font-semibold text-[#475569]">Titik Awal</span>
            </div>
            <div className="mb-1.5 flex items-center gap-2">
              <div className="relative flex h-5 w-4 items-center justify-center rounded-sm bg-orange-500 shadow-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
              </div>
              <span className="text-[11px] font-semibold text-[#475569]">Lokasi Terkini</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-4 items-center justify-center rounded-sm bg-green-600 shadow-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
              </div>
              <span className="text-[11px] font-semibold text-[#475569]">Tujuan</span>
            </div>
          </div>

          <div className="absolute bottom-3 left-3 z-[1000] rounded-2xl border border-[#e5ebe5] bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 rounded-full bg-orange-500"></div>
              <span className="text-[10px] font-semibold text-[#475569]">Sudah ditempuh</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-0.5 w-6 rounded-full bg-[#94a3b8]" style={{ borderStyle: "dashed", borderWidth: "0 0 2px 0", borderImage: "repeating-linear-gradient(90deg, #94a3b8 0, #94a3b8 4px, transparent 4px, transparent 8px) 1" }}></div>
              <span className="text-[10px] font-semibold text-[#475569]">Belum ditempuh</span>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
