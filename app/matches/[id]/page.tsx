import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Chip from "@/components/Chip";
import OccupancyBadge, { colorFromConfidence } from "@/components/OccupancyBadge";
import SectionHeader from "@/components/SectionHeader";
import VenueMapLazy from "@/components/VenueMapLazy";
import { calculateCrowdConfidence as _ccc, enrichRankedWithRealCrowd } from "@/lib/crowd/calculate";
import { readPickedCountry } from "@/lib/country-cookie";
import { flagEmoji } from "@/lib/flags";
import {
  formatKickoffLocal,
  kickoffCountdown,
  matchCode,
  rankVenuesForFixture,
  type RankedVenue,
} from "@/lib/matchday";
import {
  getAllVenues,
  getCountryByCode,
  getFixtureById,
  getRankedBarsForCountry,
} from "@/lib/queries";
import { getTeamByCode } from "@/lib/wc2026-teams";

void _ccc;

export const revalidate = 60;

type Params = { params: Promise<{ id: string }> };

type BucketId = "official" | "public" | "fan-bars" | "bars";
type Bucket = {
  id: BucketId;
  label: string;
  description: string;
  items: RankedVenue[];
};

export default async function MatchPage({ params }: Params) {
  const { id } = await params;
  const [fixture, venues, pickedCode] = await Promise.all([
    getFixtureById(id),
    getAllVenues(),
    readPickedCountry(),
  ]);

  if (!fixture) notFound();

  const baseRanked = rankVenuesForFixture(venues, fixture);
  const ranked = await enrichRankedWithRealCrowd(baseRanked, fixture);

  // If the user has picked a team, separate "fan bars" (bars curated for
  // that team via bar_country_affinity) from the general "Bars" pool.
  const fanBarIds = new Set<string>();
  let pickedDisplayName: string | null = null;
  if (pickedCode) {
    const [pickedCountryRow, affinityBars] = await Promise.all([
      getCountryByCode(pickedCode).catch(() => null),
      getRankedBarsForCountry(pickedCode).catch(() => []),
    ]);
    pickedDisplayName =
      pickedCountryRow?.name ?? getTeamByCode(pickedCode)?.name ?? pickedCode;
    for (const a of affinityBars) fanBarIds.add(a.venue.id);
  }

  const officialItems = ranked.filter(
    (r) =>
      r.venue.type === "official_fan_zone" ||
      r.venue.type === "official_watch_party",
  );
  const publicItems = ranked.filter((r) => r.venue.type === "credible_public");
  const allBarItems = ranked.filter((r) => r.venue.type === "fallback_bar");
  const fanBarItems = pickedCode
    ? allBarItems.filter((r) => fanBarIds.has(r.venue.id))
    : [];
  const otherBarItems = pickedCode
    ? allBarItems.filter((r) => !fanBarIds.has(r.venue.id))
    : allBarItems;

  const grouped: Bucket[] = [
    {
      id: "official",
      label: "Official",
      description: "FIFA-sanctioned fan zones and watch parties.",
      items: officialItems,
    },
    {
      id: "public",
      label: "Public",
      description: "City-backed and credible community spots.",
      items: publicItems,
    },
    ...(pickedCode && fanBarItems.length
      ? [
          {
            id: "fan-bars" as const,
            label: pickedDisplayName
              ? `${pickedDisplayName} fan bars`
              : "Fan bars",
            description: "Curated supporter bars for the team you follow.",
            items: fanBarItems,
          },
        ]
      : []),
    {
      id: "bars",
      label: "Bars",
      description: pickedCode
        ? "Other supporter and sports bars across the city."
        : "Supporter and sports bars across the city.",
      items: otherBarItems,
    },
  ];

  const mapMarkers = ranked.map((r) => ({
    id: r.venue.id,
    name: r.venue.name,
    lat: r.venue.lat,
    lng: r.venue.lng,
    tier: r.venue.relevance_level,
    href: `/venues/${r.venue.id}`,
    subtitle: r.venue.address,
  }));

  return (
    <main className="mx-auto max-w-7xl space-y-section-gap px-container-padding py-section-gap">
      {/* Back link */}
      <Link
        href="/"
        className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary"
      >
        ← BACK TO HOME
      </Link>

      {/* Match header */}
      <header>
        <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
          {matchCode(fixture)}
        </p>
        <h1 className="mt-stack-md flex flex-wrap items-center gap-3 text-display-xl text-on-surface">
          <span aria-hidden className="text-[0.7em]">
            {flagEmoji(fixture.home_team) || "🏳️"}
          </span>
          <span>{fixture.home_team}</span>
          <span className="font-light text-on-surface-variant">v</span>
          <span aria-hidden className="text-[0.7em]">
            {flagEmoji(fixture.away_team) || "🏳️"}
          </span>
          <span>{fixture.away_team}</span>
        </h1>
        <div className="mt-stack-md flex flex-wrap items-center gap-x-4 gap-y-2 text-body-main text-on-surface-variant">
          <span className="inline-flex items-center gap-2">
            <span className="material-symbols-outlined" aria-hidden>
              schedule
            </span>
            {formatKickoffLocal(fixture)}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="material-symbols-outlined" aria-hidden>
              timer
            </span>
            {kickoffCountdown(fixture)}
          </span>
          {fixture.played_in_bay_area ? (
            <Chip tone="success" size="sm" icon="stadium">
              Levi&apos;s Stadium
            </Chip>
          ) : null}
        </div>
        {fixture.notes ? (
          <p className="mt-stack-md max-w-2xl text-body-main text-on-surface-variant">
            {fixture.notes}
          </p>
        ) : null}
      </header>

      {/* Empty state */}
      {ranked.length === 0 ? (
        <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg">
          <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
            No venues announced yet
          </p>
          <p className="mt-stack-sm text-body-main text-on-surface-variant">
            Bay Area Host Committee schedules are subject to FIFA and
            broadcast-partner approvals. Check back closer to kickoff.
          </p>
        </section>
      ) : null}

      {/* Type chip nav */}
      {ranked.length > 0 ? (
        <section>
          <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
            Match viewing options
          </p>
          <div className="mt-stack-md flex flex-wrap gap-2">
            {grouped.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-body-sm font-semibold transition ${
                  g.items.length > 0
                    ? "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary hover:text-primary"
                    : "cursor-not-allowed border-outline-variant bg-surface-container text-on-surface-variant opacity-60"
                }`}
                aria-disabled={g.items.length === 0}
              >
                {g.label}
                <span className="text-on-surface-variant">{g.items.length}</span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {/* Map */}
      {ranked.length > 0 ? (
        <section>
          <SectionHeader title="On the map" eyebrow="Venues" />
          <div className="overflow-hidden rounded-lg border border-outline-variant">
            <VenueMapLazy markers={mapMarkers} highlightId={ranked[0]?.venue.id} />
          </div>
        </section>
      ) : null}

      {/* Three buckets: Official · Public · Bars */}
      {grouped.map((bucket) =>
        bucket.items.length === 0 ? null : (
          <section key={bucket.id} id={bucket.id}>
            <SectionHeader title={bucket.label} eyebrow={bucket.description} />
            <ol className="space-y-gutter">
              {bucket.items.map((r, idx) => (
                <li key={r.venue.id}>
                  <RankedRow rank={idx + 1} item={r} />
                </li>
              ))}
            </ol>
          </section>
        ),
      )}
    </main>
  );
}

function RankedRow({ rank, item }: { rank: number; item: RankedVenue }) {
  const v = item.venue;
  const color = colorFromConfidence(item.crowd);
  const occupancyLabel =
    item.crowd === "open"
      ? "Open"
      : item.crowd === "room"
        ? "Comfortable"
        : item.crowd === "filling_up"
          ? "Filling up"
          : item.crowd === "packed"
            ? "Tight"
            : "Full";

  return (
    <Link
      href={`/venues/${v.id}`}
      className="group flex flex-col gap-stack-md overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest transition hover:-translate-y-[1px] hover:border-primary hover:shadow-ambient md:flex-row"
    >
      {/* Rank + image */}
      <div className="relative flex-none overflow-hidden bg-surface-container md:w-72">
        <div className="absolute left-stack-md top-stack-md z-10 flex h-9 w-9 items-center justify-center rounded-md bg-on-surface text-body-sm font-bold text-background">
          {String(rank).padStart(2, "0")}
        </div>
        {v.photo_url ? (
          <Image
            src={v.photo_url}
            alt={v.name}
            width={600}
            height={400}
            sizes="(max-width: 768px) 100vw, 288px"
            className="h-44 w-full object-cover md:h-full"
          />
        ) : (
          <div className="flex h-44 items-center justify-center text-5xl text-on-surface-variant md:h-full">
            🏳️
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-stack-md p-stack-lg">
        <div>
          <h3 className="text-headline-md text-on-surface group-hover:text-primary">
            {v.name}
          </h3>
          <p className="mt-stack-sm text-body-sm text-on-surface-variant">
            {v.address}
          </p>
        </div>
        <p className="text-body-sm text-on-surface-variant">{item.reason}</p>
        <div className="flex flex-wrap items-center gap-2">
          <OccupancyBadge color={color} label={occupancyLabel} size="sm" />
          {v.atmosphere?.vibe ? (
            <Chip tone="neutral" size="sm">
              {v.atmosphere.vibe}
            </Chip>
          ) : null}
          <Chip tone="neutral" size="sm">
            {v.indoor_outdoor}
          </Chip>
        </div>
      </div>
    </Link>
  );
}
