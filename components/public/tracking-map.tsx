"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";

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

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const originIcon = L.divIcon({
  className: "shipin-origin-pin",
  html: `<span style="display:inline-flex;height:16px;width:16px;border-radius:9999px;background:#3b82f6;border:3px solid #dbeafe;box-shadow:0 0 0 4px rgba(59,130,246,0.25);"></span>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const destinationIcon = L.divIcon({
  className: "shipin-destination-pin",
  html: `<span style="display:inline-flex;height:16px;width:16px;border-radius:9999px;background:#22c55e;border:3px solid #bbf7d0;box-shadow:0 0 0 4px rgba(34,197,94,0.25);"></span>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const latestIcon = L.divIcon({
  className: "shipin-latest-pin",
  html: `<span style="display:inline-flex;height:18px;width:18px;border-radius:9999px;background:#f97316;border:3px solid #fed7aa;box-shadow:0 0 0 5px rgba(249,115,22,0.3);"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

export function TrackingMap({
  origin,
  destination,
  latest,
  waktuBerangkat,
  durasiEstimasiMs,
  heightClassName = "h-[170px]",
  zoom = 6,
  scrollWheelZoom = true
}: TrackingMapProps) {
  const [, forceUpdate] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute animated position
  const animatedPos = useMemo<MapPoint | null>(() => {
    if (!origin || !destination) return null;

    // If no timing data, show midpoint
    if (!waktuBerangkat || !durasiEstimasiMs || durasiEstimasiMs <= 0) {
      return {
        lat: (origin.lat + destination.lat) / 2,
        lng: (origin.lng + destination.lng) / 2,
        label: "Rute pengiriman"
      };
    }

    const progress = Math.max(0, Math.min(1, (Date.now() - waktuBerangkat) / durasiEstimasiMs));
    return {
      lat: origin.lat + (destination.lat - origin.lat) * progress,
      lng: origin.lng + (destination.lng - origin.lng) * progress,
      label: progress >= 1 ? "Paket sampai" : "Paket dalam perjalanan"
    };
  }, [origin, destination, waktuBerangkat, durasiEstimasiMs]);

  // Update marker position every 5 seconds via forceUpdate
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      forceUpdate((n) => n + 1);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Center priority: animated > latest > origin > destination > Indonesia center
  const center = useMemo<[number, number]>(() => {
    if (animatedPos) return [animatedPos.lat, animatedPos.lng];
    if (latest) return [latest.lat, latest.lng];
    if (origin) return [origin.lat, origin.lng];
    if (destination) return [destination.lat, destination.lng];
    return [-2.5, 118];
  }, [animatedPos, latest, origin, destination]);

  // Route polyline points
  const routePoints = useMemo<[number, number][]>(() => {
    const points: [number, number][] = [];
    if (origin) points.push([origin.lat, origin.lng]);
    if (animatedPos) points.push([animatedPos.lat, animatedPos.lng]);
    if (latest && (latest.lat !== origin?.lat || latest.lng !== origin?.lng)) {
      points.push([latest.lat, latest.lng]);
    }
    if (destination) points.push([destination.lat, destination.lng]);
    return points;
  }, [origin, animatedPos, latest, destination]);

  useEffect(() => {
    L.Marker.prototype.options.icon = markerIcon;
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={scrollWheelZoom}
      className={`${heightClassName} w-full`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {origin && <Marker position={[origin.lat, origin.lng]} icon={originIcon} />}

      {destination && <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />}

      {(animatedPos || latest) && (
        <Marker
          position={[
            animatedPos?.lat ?? latest!.lat,
            animatedPos?.lng ?? latest!.lng
          ]}
          icon={latestIcon}
        />
      )}

      {routePoints.length > 1 && (
        <Polyline
          positions={routePoints}
          pathOptions={{ color: "#f97316", weight: 4, opacity: 0.7, dashArray: "12 8" }}
        />
      )}
    </MapContainer>
  );
}
