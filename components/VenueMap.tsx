"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapMarker = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** legacy tier; kept so existing call sites still compile */
  tier?: "primary" | "secondary" | "fallback";
  /** true → official fan bar (gold pulse); false → regular bar (silver diamond) */
  isOfficial?: boolean;
  /** when true → render a star marker (any public fan zone / watch party) */
  isPublicSpot?: boolean;
  /** FIFA-sanctioned star — brighter gold than a public-spot star */
  isFifaOfficial?: boolean;
  href?: string;
  subtitle?: string;
  /** atmosphere tag — e.g. "Hardcore", "Party"; rendered in the glass preview */
  vibe?: string | null;
  /** photo for glass preview */
  photoUrl?: string | null;
};

type Props = {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  /** id of the marker that should be highlighted/bouncing — driven by parent
   *  hover state (e.g. the bar list below the map sets this) */
  activeId?: string | null;
  /** alias of activeId, retained for legacy callers */
  highlightId?: string | null;
  /** notify parent when a marker is hovered (for map-to-list sync) */
  onMarkerHover?: (id: string | null) => void;
  /** dark hub style with custom markers + glass preview */
  variant?: "hub" | "classic";
};

function isOfficialMarker(m: MapMarker): boolean {
  if (m.isOfficial != null) return m.isOfficial;
  // Fallback heuristic for legacy callers: tier `primary` ≈ official.
  return m.tier === "primary";
}

function buildMarkerIcon(m: MapMarker, active: boolean): L.DivIcon {
  const isFifa = m.isFifaOfficial === true;
  const isZone = !isFifa && m.isPublicSpot === true;
  const official = !isFifa && !isZone && isOfficialMarker(m);
  const tierClass = isFifa
    ? "fr-marker--fifa"
    : isZone
      ? "fr-marker--zone"
      : official
        ? "fr-marker--official"
        : "fr-marker--bar";
  const cls = [
    "fr-marker",
    tierClass,
    active ? "fr-marker--active" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const html = isFifa || isZone
    ? `<span class="fr-star" aria-hidden>★</span>`
    : official
      ? `<span class="fr-pulse"></span><span class="fr-dot"></span>`
      : `<span class="fr-dot"></span>`;
  return L.divIcon({
    className: cls,
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/** Captures the underlying Leaflet map instance and hands it back to the
 *  parent so we can render overlay UI (the glass preview) outside the
 *  MapContainer subtree, where plain JSX is hidden. */
function MapBridge({ onMap }: { onMap: (m: L.Map | null) => void }) {
  const map = useMap();
  useEffect(() => {
    onMap(map);
    return () => onMap(null);
  }, [map, onMap]);
  return null;
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 14);
      return;
    }
    const bounds = L.latLngBounds(
      markers.map((m) => [m.lat, m.lng] as LatLngExpression),
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [map, markers]);
  return null;
}

function MarkerLayer({
  markers,
  activeId,
  onHover,
  setHovered,
}: {
  markers: MapMarker[];
  activeId: string | null;
  onHover?: (id: string | null) => void;
  setHovered: (m: MapMarker | null) => void;
}) {
  const icons = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();
    for (const m of markers) {
      cache.set(m.id, buildMarkerIcon(m, m.id === activeId));
    }
    return cache;
  }, [markers, activeId]);

  return (
    <>
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={icons.get(m.id)!}
          eventHandlers={{
            mouseover: () => {
              setHovered(m);
              onHover?.(m.id);
            },
            mouseout: () => {
              setHovered(null);
              onHover?.(null);
            },
            click: () => {
              if (m.href) window.location.assign(m.href);
            },
          }}
        />
      ))}
    </>
  );
}

export default function VenueMap({
  markers,
  center = [37.7749, -122.4194],
  zoom = 12.5,
  activeId = null,
  highlightId = null,
  onMarkerHover,
  variant = "classic",
}: Props) {
  // Treat the legacy highlightId as activeId so existing callers (the venue
  // detail map) keep working without code changes.
  const externalActive = activeId ?? highlightId;
  const [mapInst, setMapInst] = useState<L.Map | null>(null);
  const [hovered, setHovered] = useState<MapMarker | null>(null);
  const [previewPos, setPreviewPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  // Hovered marker (from map) takes precedence over external activeId so the
  // pulse follows whatever the user is currently pointing at.
  const effectiveActive = hovered?.id ?? externalActive;

  // Resolve the active marker so the preview can render even when the parent
  // is the one driving hover (list → map sync).
  const previewMarker = useMemo(() => {
    if (hovered) return hovered;
    if (externalActive) return markers.find((m) => m.id === externalActive) ?? null;
    return null;
  }, [hovered, externalActive, markers]);

  // Re-project preview lat/lng → screen on every move/zoom.
  useEffect(() => {
    if (!mapInst || !previewMarker) {
      setPreviewPos(null);
      return;
    }
    const update = () => {
      const p = mapInst.latLngToContainerPoint([
        previewMarker.lat,
        previewMarker.lng,
      ]);
      setPreviewPos({ x: p.x, y: p.y });
    };
    update();
    mapInst.on("move zoom resize", update);
    return () => {
      mapInst.off("move zoom resize", update);
    };
  }, [mapInst, previewMarker]);

  // CARTO Voyager — colorful, readable basemap with subtle shading.
  const tileUrl =
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  return (
    <div
      className={
        variant === "hub"
          ? "venue-hub-map relative h-[440px] w-full overflow-hidden"
          : "h-[360px] w-full overflow-hidden rounded-md border border-rule"
      }
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        zoomControl={variant === "hub"}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
        />
        <MapBridge onMap={setMapInst} />
        <FitBounds markers={markers} />
        <MarkerLayer
          markers={markers}
          activeId={effectiveActive}
          onHover={onMarkerHover}
          setHovered={setHovered}
        />
      </MapContainer>

      {/* Glass preview — sibling overlay, absolutely positioned. */}
      {variant === "hub" && previewMarker && previewPos ? (
        <GlassPreview marker={previewMarker} pos={previewPos} />
      ) : null}
    </div>
  );
}

function GlassPreview({
  marker,
  pos,
}: {
  marker: MapMarker;
  pos: { x: number; y: number };
}) {
  const isFifa = marker.isFifaOfficial === true;
  const isZone = !isFifa && marker.isPublicSpot === true;
  const official = !isFifa && !isZone && isOfficialMarker(marker);
  const kindLabel = isFifa
    ? "★ Official"
    : isZone
      ? "★ Public"
      : official
        ? "● Fans"
        : "◆ Bar";
  const tag = marker.vibe ?? (isFifa ? "Official" : isZone ? "Public" : official ? "Fans" : "Bar");
  return (
    <div
      className="fr-preview"
      style={{
        left: pos.x - 120,
        top: pos.y - 28,
        transform: "translateY(-100%)",
      }}
    >
      <div className="fr-preview__card">
        {marker.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={marker.photoUrl}
            alt={marker.name}
            className="fr-preview__photo"
          />
        ) : (
          <div className="fr-preview__photo fr-preview__photo--placeholder">
            {isFifa || isZone ? "⭐" : official ? "🏟️" : "🍺"}
          </div>
        )}
        <div className="fr-preview__body">
          <div
            className={`fr-preview__tag ${
              isFifa || isZone || official ? "" : "fr-preview__tag--bar"
            }`}
          >
            {kindLabel} · {tag}
          </div>
          <div className="fr-preview__name">{marker.name}</div>
        </div>
      </div>
    </div>
  );
}
