"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import VenueMapLazy from "./VenueMapLazy";
import type { MapMarker } from "./VenueMap";

export type HubVenue = {
  id: string;
  name: string;
  neighborhood: string | null;
  address: string | null;
  lat: number;
  lng: number;
  isOfficial: boolean;
  vibe: string | null;
  photoUrl: string | null;
};

type Props = {
  venues: HubVenue[];
  /** label shown in the section header */
  title?: string;
  eyebrow?: string;
};

export default function VenueHub({
  venues,
  title = "Where to watch in SF",
  eyebrow = "Modern Sports Venue Hub",
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const markers: MapMarker[] = venues.map((v) => ({
    id: v.id,
    name: v.name,
    lat: v.lat,
    lng: v.lng,
    isOfficial: v.isOfficial,
    vibe: v.vibe,
    photoUrl: v.photoUrl,
    href: `/venues/${v.id}`,
    subtitle: v.address ?? undefined,
  }));

  if (venues.length === 0) return null;

  return (
    <section>
      {/* Header */}
      <div className="mb-stack-lg flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
            {eyebrow}
          </p>
          <h2 className="mt-stack-md text-display-md text-on-surface">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-4 text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{
                background: "#FFCE00",
                boxShadow: "0 0 10px rgba(255,206,0,0.7)",
              }}
              aria-hidden
            />
            Official
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rotate-45 bg-white/80"
              aria-hidden
            />
            Bar
          </span>
        </div>
      </div>

      {/* Map */}
      <VenueMapLazy
        markers={markers}
        activeId={activeId}
        onMarkerHover={setActiveId}
        variant="hub"
      />

      {/* Synced list — hovering a card highlights the marker on the map */}
      <ul
        role="list"
        className="mt-stack-lg grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3"
      >
        {venues.map((v) => (
          <li key={v.id}>
            <HubCard
              venue={v}
              active={activeId === v.id}
              onEnter={() => setActiveId(v.id)}
              onLeave={() =>
                setActiveId((cur) => (cur === v.id ? null : cur))
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function HubCard({
  venue,
  active,
  onEnter,
  onLeave,
}: {
  venue: HubVenue;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <Link
      href={`/venues/${venue.id}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      className={`group relative block overflow-hidden rounded-lg border bg-surface-container-lowest transition duration-200 ${
        active
          ? "-translate-y-[2px] border-primary shadow-ambient"
          : "border-outline-variant hover:-translate-y-[1px] hover:border-primary"
      }`}
      style={
        active
          ? { boxShadow: "0 18px 40px -10px rgba(255,206,0,0.25)" }
          : undefined
      }
    >
      <div className="relative h-32 w-full overflow-hidden bg-surface-container">
        {venue.photoUrl ? (
          <Image
            src={venue.photoUrl}
            alt={venue.name}
            width={500}
            height={260}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`h-full w-full object-cover transition duration-300 ${
              active ? "scale-[1.04]" : "group-hover:scale-[1.02]"
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            {venue.isOfficial ? "⭐" : "🍺"}
          </div>
        )}
        <div className="absolute left-3 top-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
              venue.isOfficial
                ? "text-[#0c1116]"
                : "bg-white/85 text-[#0c1116]"
            }`}
            style={
              venue.isOfficial
                ? { background: "#FFCE00", boxShadow: "0 0 14px rgba(255,206,0,0.5)" }
                : undefined
            }
          >
            {venue.isOfficial ? "● Official" : "◆ Bar"}
          </span>
        </div>
      </div>
      <div className="p-stack-md">
        <h3 className="text-headline-sm text-on-surface group-hover:text-primary">
          {venue.name}
        </h3>
        {venue.neighborhood || venue.vibe ? (
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {venue.neighborhood ?? ""}
            {venue.neighborhood && venue.vibe ? " · " : ""}
            {venue.vibe ?? ""}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
