import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AtmosphereGrid, { type AtmosphereCell } from "@/components/AtmosphereGrid";
import BarCard, { type BarCardData } from "@/components/BarCard";
import Chip from "@/components/Chip";
import OccupancyBadge, { colorFromConfidence } from "@/components/OccupancyBadge";
import ReportButtons from "@/components/ReportButtons";
import SectionHeader from "@/components/SectionHeader";
import UpcomingMatchCard from "@/components/UpcomingMatchCard";
import VenueMapLazy from "@/components/VenueMapLazy";
import { readPickedCountry } from "@/lib/country-cookie";
import { calculateCrowdConfidence } from "@/lib/crowd/calculate";
import { occupancyVerdict } from "@/lib/crowd/occupancy-copy";
import { flagEmoji } from "@/lib/flags";
import { stageLabel, venueQualifiesForFixture } from "@/lib/matchday";
import {
  getAllFixtures,
  getAllVenues,
  getCountryByCode,
  getRankedBarsForCountry,
  getVenueById,
} from "@/lib/queries";
import type { Fixture } from "@/lib/types";
import { getTeamByCode } from "@/lib/wc2026-teams";

export const revalidate = 60;

type Params = { params: Promise<{ id: string }> };

const VENUE_TYPE_LABEL: Record<string, string> = {
  official_fan_zone: "Fan Zone",
  official_watch_party: "Watch Party",
  credible_public: "Public",
  fallback_bar: "Bar",
};

function splitNotes(notes: string | null): string[] {
  if (!notes) return [];
  return notes
    .split(/\. (?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.endsWith(".") ? s : `${s}.`));
}

function kickoffLabel(f: Fixture): string {
  return new Date(f.kickoff_local).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function VenuePage({ params }: Params) {
  const { id } = await params;
  const [venue, fixtures, allVenues, pickedCode] = await Promise.all([
    getVenueById(id),
    getAllFixtures(),
    getAllVenues(),
    readPickedCountry(),
  ]);

  if (!venue) notFound();

  const showing = fixtures.filter((f) => venueQualifiesForFixture(venue, f));
  const upcomingShowing = showing.filter(
    (f) => new Date(f.kickoff_utc).getTime() >= Date.now(),
  );
  const fixturesForCountry = pickedCode
    ? upcomingShowing.filter(
        (f) =>
          f.home_team === pickedCode || f.away_team === pickedCode,
      )
    : null;
  const matchesToShow = fixturesForCountry ?? upcomingShowing;

  const pickedTeam = pickedCode ? getTeamByCode(pickedCode) : null;
  const pickedCountryRow = pickedCode
    ? await getCountryByCode(pickedCode).catch(() => null)
    : null;
  const pickedDisplayName =
    pickedCountryRow?.name ?? pickedTeam?.name ?? pickedCode ?? null;

  const otherCountryBars = pickedCode
    ? (await getRankedBarsForCountry(pickedCode).catch(() => [])).filter(
        (b) => b.venue.id !== venue.id,
      )
    : [];

  const referenceFixture = upcomingShowing[0] ?? null;
  const crowdNow = referenceFixture
    ? await calculateCrowdConfidence(venue, referenceFixture)
    : null;

  const verdict = crowdNow
    ? {
        color: colorFromConfidence(crowdNow.crowd),
        label:
          crowdNow.crowd === "open"
            ? "Open"
            : crowdNow.crowd === "room"
              ? "Comfortable"
              : crowdNow.crowd === "filling_up"
                ? "Filling up"
                : crowdNow.crowd === "packed"
                  ? "Tight"
                  : "Full",
        note: "",
      }
    : null;

  const atmosphereCells: AtmosphereCell[] = [
    {
      icon: "trip",
      label: "Setting",
      value: venue.indoor_outdoor.replace(/^\w/, (c) => c.toUpperCase()),
    },
    {
      icon: "groups",
      label: "Vibe",
      value: venue.atmosphere?.vibe
        ? venue.atmosphere.vibe.replace(/^\w/, (c) => c.toUpperCase())
        : "TBD",
    },
    {
      icon: "volume_up",
      label: "Sound",
      value: venue.atmosphere?.sound_on_likelihood
        ? venue.atmosphere.sound_on_likelihood.replace(/^\w/, (c) =>
            c.toUpperCase(),
          )
        : "TBD",
    },
    {
      icon: "people",
      label: "Capacity",
      value:
        venue.capacity_estimate != null
          ? venue.capacity_estimate.toLocaleString()
          : "TBD",
    },
    {
      icon: "restaurant",
      label: "Food",
      value:
        venue.food_available === true
          ? "Yes"
          : venue.food_available === false
            ? "No"
            : "TBD",
    },
  ];

  const venueTypeLabel = VENUE_TYPE_LABEL[venue.type] ?? venue.type;

  return (
    <main className="mx-auto max-w-7xl space-y-section-gap px-container-padding py-section-gap">
      {/* Back link */}
      <Link
        href="/"
        className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary"
      >
        ← BACK TO HOME
      </Link>

      {/* Hero photo */}
      {venue.photo_url ? (
        <div className="overflow-hidden rounded-xl border border-outline-variant">
          <Image
            src={venue.photo_url}
            alt={venue.name}
            width={1600}
            height={800}
            sizes="(max-width: 768px) 100vw, 1280px"
            className="h-64 w-full object-cover md:h-96"
            priority
          />
        </div>
      ) : null}

      {/* Title block */}
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="primary" size="sm" icon="verified">
            {venueTypeLabel}
          </Chip>
          {venue.relevance_level && venue.relevance_level !== "fallback" ? (
            <Chip tone="neutral" size="sm">
              {venue.relevance_level}
            </Chip>
          ) : null}
        </div>
        <h1 className="mt-stack-md text-display-xl text-on-surface">
          {venue.name}
        </h1>
        <p className="mt-stack-md text-body-main text-on-surface-variant">
          {venue.address}
        </p>
      </header>

      {/* Status / right now */}
      {verdict ? (
        <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg">
          <div className="flex flex-wrap items-center justify-between gap-stack-md">
            <div className="flex flex-col gap-stack-sm">
              <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
                Right now
              </p>
              <OccupancyBadge color={verdict.color} label={verdict.label} />
            </div>
            <ReportButtons venueId={venue.id} />
          </div>
        </section>
      ) : null}

      {/* Atmosphere & Guide */}
      <section>
        <SectionHeader title="Atmosphere & Guide" eyebrow="Inside" />
        <AtmosphereGrid cells={atmosphereCells} />
      </section>

      {/* Description / Map */}
      <section className="grid grid-cols-1 gap-section-gap md:grid-cols-[1fr_1.1fr]">
        <div className="space-y-stack-lg">
          {venue.description ? (
            <div className="space-y-stack-md text-body-main text-on-surface-variant">
              {venue.description
                .split(/\n{2,}/)
                .map((p, i) => <p key={i}>{p}</p>)}
            </div>
          ) : null}
          {splitNotes(venue.notes).length > 0 ? (
            <ul
              role="list"
              className="space-y-stack-sm text-body-sm text-on-surface-variant"
            >
              {splitNotes(venue.notes).map((n, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-on-surface-variant">·</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {venue.source_urls.length > 0 ? (
            <div>
              <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
                Sources
              </p>
              <ul role="list" className="mt-stack-sm space-y-1 text-body-sm">
                {venue.source_urls.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-on-surface-variant underline underline-offset-2 hover:text-primary"
                    >
                      {new URL(url).hostname.replace(/^www\./, "")}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="overflow-hidden rounded-lg border border-outline-variant">
          <VenueMapLazy
            markers={allVenues.map((v) => ({
              id: v.id,
              name: v.name,
              lat: v.lat,
              lng: v.lng,
              tier: v.relevance_level,
              href: `/venues/${v.id}`,
              subtitle: v.address,
            }))}
            highlightId={venue.id}
          />
        </div>
      </section>

      {/* Matches showing */}
      <section>
        <SectionHeader
          title={
            pickedCode && pickedDisplayName
              ? `${pickedDisplayName} matches at ${venue.name}`
              : `Matches showing at ${venue.name}`
          }
          eyebrow={
            pickedCode && pickedDisplayName
              ? `${flagEmoji(pickedCode) ?? ""} Following ${pickedDisplayName}`.trim()
              : "Schedule"
          }
        />
        {matchesToShow.length === 0 ? (
          <p className="text-body-main text-on-surface-variant">
            {pickedCode && pickedDisplayName
              ? `No upcoming ${pickedDisplayName} matches at this venue. `
              : "No upcoming fixtures yet. "}
            <Link
              href="/onboarding"
              className="text-primary underline underline-offset-4"
            >
              change team
            </Link>
          </p>
        ) : (
          <ul
            role="list"
            className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3"
          >
            {matchesToShow.slice(0, 9).map((f) => (
              <li key={f.match_id}>
                <UpcomingMatchCard
                  data={{
                    matchId: f.match_id,
                    homeCode: f.home_team,
                    awayCode: f.away_team,
                    stage: stageLabel(f.stage).toUpperCase(),
                    kickoffLabel: kickoffLabel(f),
                    hostStadium: f.played_in_bay_area
                      ? "Levi's Stadium"
                      : null,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* More bars for the picked country */}
      {pickedCode && otherCountryBars.length ? (
        <section>
          <SectionHeader
            title={`More ${pickedDisplayName} bars`}
            eyebrow="Where the supporters go"
          />
          <ul role="list" className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            {otherCountryBars.map((b) => {
              const v = occupancyVerdict({
                demandTier: pickedCountryRow?.fan_demand_tier ?? null,
                affinityRole: b.role,
                minutesToKickoff: null,
                liveConfidence: null,
              });
              const data: BarCardData = {
                id: b.venue.id,
                name: b.venue.name,
                neighborhood: b.venue.neighborhood,
                address: b.venue.address,
                photoUrl: b.venue.photo_url,
                isOfficial: b.role === "home_bar",
                teamLabel: pickedDisplayName?.toUpperCase() ?? null,
                walkingTime: null,
                occupancy: v,
              };
              return (
                <li key={b.venue.id}>
                  <BarCard
                    bar={data}
                    variant="compact"
                    flagFallback={flagEmoji(pickedCode) ?? ""}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
