"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapMarker = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tier: "primary" | "secondary" | "fallback";
  href?: string;
  subtitle?: string;
};

type Props = {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  highlightId?: string;
};

const TIER_COLOR: Record<MapMarker["tier"], string> = {
  primary: "#0B7A4E",
  secondary: "#D97706",
  fallback: "#6B7280",
};

function circleIcon(color: string, highlighted: boolean) {
  const size = highlighted ? 22 : 16;
  const borderWidth = highlighted ? 3 : 2;
  return L.divIcon({
    className: "venue-marker",
    html: `<span style="
      display:inline-block;
      width:${size}px;
      height:${size}px;
      background:${color};
      border:${borderWidth}px solid #F4EFE3;
      border-radius:9999px;
      box-shadow:0 2px 6px rgba(15,23,32,0.25);
    "></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 14);
      return;
    }
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as LatLngExpression));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [map, markers]);
  return null;
}

export default function VenueMap({
  markers,
  center = [37.7749, -122.4194],
  zoom = 12,
  highlightId,
}: Props) {
  const icons = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();
    for (const m of markers) {
      const highlighted = m.id === highlightId;
      const key = `${m.tier}-${highlighted ? "hi" : "lo"}`;
      if (!cache.has(key)) cache.set(key, circleIcon(TIER_COLOR[m.tier], highlighted));
    }
    return cache;
  }, [markers, highlightId]);

  return (
    <div className="h-[360px] w-full overflow-hidden rounded-md border border-rule">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <FitBounds markers={markers} />
        {markers.map((m) => {
          const highlighted = m.id === highlightId;
          const icon = icons.get(`${m.tier}-${highlighted ? "hi" : "lo"}`)!;
          return (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={icon}>
              <Popup>
                <div className="font-sans">
                  <div className="text-xs uppercase tracking-wide text-ink-muted">
                    {m.tier}
                  </div>
                  <div className="font-display text-base">{m.name}</div>
                  {m.subtitle ? (
                    <div className="mt-1 text-xs text-ink-muted">{m.subtitle}</div>
                  ) : null}
                  {m.href ? (
                    <a
                      href={m.href}
                      className="mt-2 inline-block text-xs underline underline-offset-2"
                    >
                      View details →
                    </a>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
