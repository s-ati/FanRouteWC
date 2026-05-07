import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import HeroTile from "@/components/HeroTile";
import KnockoutBracket from "@/components/KnockoutBracket";
import MatchHero from "@/components/MatchHero";
import TeamIdentityHero from "@/components/TeamIdentityHero";
import MatchesGrid from "@/components/MatchesGrid";
import StandingsTable, { type StandingsRow } from "@/components/StandingsTable";
import BarCard, { type BarCardData } from "@/components/BarCard";
import SectionHeader from "@/components/SectionHeader";
import Chip from "@/components/Chip";
import TeamPicker from "@/components/TeamPicker";
import VenueHub, { type HubVenue } from "@/components/VenueHub";
import {
  getAllFixtures,
  getCountryByCode,
  getFanZonesByIds,
  getRankedBarsForCountry,
} from "@/lib/queries";
import type { Fixture } from "@/lib/types";
import {
  formatKickoffLocal,
  kickoffCountdown,
  stageLabel,
} from "@/lib/matchday";
import { mergeFixturesIntoSchedule } from "@/lib/wc2026-matches";
import { findGroupForTeam, getScheduleAsMatchCards } from "@/lib/wc2026-schedule";
import { COUNTRY_COOKIE, readPickedCountry } from "@/lib/country-cookie";
import { getTeamByCode } from "@/lib/wc2026-teams";
import { occupancyVerdict } from "@/lib/crowd/occupancy-copy";
import { teamHeroImages } from "@/lib/team-imagery";

export const revalidate = 60;

// ---------------------------------------------------------------------------
// Server actions

async function pickTeamAction(formData: FormData) {
  "use server";
  const code = String(formData.get("country_code") ?? "")
    .trim()
    .toUpperCase();
  if (code.length !== 3) return;
  const store = await cookies();
  store.set(COUNTRY_COOKIE, code, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
  redirect("/");
}

// ---------------------------------------------------------------------------
// Helpers

function fixturesForTeam(all: Fixture[], code: string): Fixture[] {
  const upper = code.toUpperCase();
  return all
    .filter((f) => f.home_team === upper || f.away_team === upper)
    .sort(
      (a, b) =>
        new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime(),
    );
}


function minutesToKickoff(f: Fixture, now = new Date()): number {
  return Math.max(
    0,
    Math.round((new Date(f.kickoff_utc).getTime() - now.getTime()) / 60000),
  );
}

// ---------------------------------------------------------------------------
// Page

export default async function HomePage() {
  const pickedCode = await readPickedCountry();

  // Cold open — no team picked yet.
  if (!pickedCode) {
    return (
      <main className="mx-auto max-w-7xl px-container-padding py-section-gap">
        <section className="mb-section-gap">
          <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
            San Francisco · 2026
          </p>
          <h1 className="mt-stack-md max-w-3xl text-display-xl text-on-surface">
            Your matchday companion.
          </h1>
          <p className="mt-stack-md max-w-2xl text-body-main text-on-surface-variant">
            FanRoute helps you find the right place to watch every World Cup
            match in San Francisco. Pick your team and we&apos;ll personalize
            your fixtures, your group standings, and the bars where the right
            crowd shows up.
          </p>
        </section>

        <section>
          <SectionHeader title="Pick your team" eyebrow="Start here" />
          <form action={pickTeamAction}>
            <TeamPicker />
          </form>
        </section>
      </main>
    );
  }

  // Personalized home.
  const [country, allFixtures, bars] = await Promise.all([
    getCountryByCode(pickedCode).catch(() => null),
    getAllFixtures().catch((): Fixture[] => []),
    getRankedBarsForCountry(pickedCode).catch(() => []),
  ]);

  const team = getTeamByCode(pickedCode);
  const displayName = country?.name ?? team?.name ?? pickedCode;

  const teamFixtures = fixturesForTeam(allFixtures, pickedCode);
  const teamUpcoming = teamFixtures.filter(
    (f) => new Date(f.kickoff_utc).getTime() >= Date.now(),
  );
  const next = teamUpcoming[0];

  // Full WC2026 tournament — 104 matches from the static schedule,
  // overlaid with Supabase kickoff times where available. Filtered to
  // upcoming so the grid stays forward-looking.
  const allUpcoming = mergeFixturesIntoSchedule(
    getScheduleAsMatchCards(),
    allFixtures,
  ).filter((m) => new Date(m.kickoffUtc).getTime() >= Date.now());

  const group = findGroupForTeam(pickedCode);
  const groupRows: StandingsRow[] = group
    ? group.teams.map((code) => ({
        countryCode: code,
        name: getTeamByCode(code)?.name ?? code,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalDiff: 0,
        points: 0,
      }))
    : [];

  // Tier-bucket the bars: official supporter bars first, then everything else.
  const officialBars = bars.filter((b) => b.role === "home_bar");
  const otherBars = bars.filter((b) => b.role !== "home_bar");

  const fanZoneIds = country?.fan_zones ?? [];
  const fanZones = fanZoneIds.length
    ? await getFanZonesByIds(fanZoneIds).catch(() => [])
    : [];

  const minsToNext = next ? minutesToKickoff(next) : null;

  // Build the unified hub dataset — fan zones + all team-aligned bars, dedup by id.
  // Filter out anything missing coordinates so the map ignores ungeocoded entries.
  const hubMap = new Map<string, HubVenue>();
  for (const fz of fanZones) {
    if (!Number.isFinite(fz.lat) || !Number.isFinite(fz.lng)) continue;
    const isFifa = fz.source_type === "fifa_official";
    hubMap.set(fz.id, {
      id: fz.id,
      name: fz.name,
      neighborhood: fz.neighborhood ?? null,
      address: fz.address ?? null,
      lat: fz.lat,
      lng: fz.lng,
      isOfficial: false,
      isPublicSpot: !isFifa,    // ★ Public  for non-FIFA fan zones / watch parties
      isFifaOfficial: isFifa,   // ★ Official for the FIFA-sanctioned spot
      vibe: fz.atmosphere?.vibe ?? null,
      photoUrl: fz.photo_url ?? null,
    });
  }
  for (const b of bars) {
    if (!Number.isFinite(b.venue.lat) || !Number.isFinite(b.venue.lng)) continue;
    if (hubMap.has(b.venue.id)) continue;
    hubMap.set(b.venue.id, {
      id: b.venue.id,
      name: b.venue.name,
      neighborhood: b.venue.neighborhood ?? null,
      address: b.venue.address ?? null,
      lat: b.venue.lat,
      lng: b.venue.lng,
      isOfficial: b.role === "home_bar",
      isPublicSpot: false,
      vibe: b.venue.atmosphere?.vibe ?? null,
      photoUrl: b.venue.photo_url ?? null,
    });
  }
  const hubVenues = Array.from(hubMap.values());

  return (
    <main className="mx-auto max-w-7xl space-y-section-gap px-container-padding py-section-gap">
      {/* Eyebrow */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
            Following · {displayName}
          </p>
          <Link
            href="/onboarding"
            className="text-label-caps font-bold uppercase tracking-[0.05em] text-primary hover:underline"
          >
            CHANGE TEAM
          </Link>
        </div>
      </section>

      {/* Hero */}
      {next ? (
        <MatchHero
          data={{
            matchId: next.match_id,
            homeCode: next.home_team,
            awayCode: next.away_team,
            stage: stageLabel(next.stage).toUpperCase(),
            countdownText: kickoffCountdown(next),
            kickoffLocal: formatKickoffLocal(next),
            hostStadium: next.played_in_bay_area ? "Levi's Stadium" : null,
            backgroundImages: teamHeroImages(pickedCode),
            ctaLabel: "Where to watch →",
            ctaHref: `/matches/${next.match_id}`,
            eyebrow: `${displayName.toUpperCase()}'S NEXT MATCH`,
          }}
        />
      ) : (
        <TeamIdentityHero
          data={{
            code: pickedCode,
            displayName,
            eyebrow: `FOLLOWING · ${displayName.toUpperCase()}`,
            tagline:
              "No San Francisco fixture for this team yet — we'll surface every match the moment the Bay Area schedule confirms it.",
            backgroundImages: teamHeroImages(pickedCode),
            ctaLabel: "Browse the schedule",
            ctaHref: "/#schedule",
          }}
        />
      )}

      {/* Subhero strip — compact quick-jumps beneath the MatchHero. The
          main heros stay in the SiteHeader nav (Standings / Bracket /
          Venues / Bars / Schedule). */}
      <section aria-label="Quick jump">
        <p className="mb-stack-sm font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
          Quick jump
        </p>
        <ul
          role="list"
          className="grid grid-cols-1 gap-2 md:grid-cols-3"
        >
          <li>
            <HeroTile
              href="/venues"
              eyebrow="Where to go"
              title="Venues"
              cta="All venues"
              icon="stadium"
              accent="amber"
            />
          </li>
          <li>
            <HeroTile
              href="/schedule"
              eyebrow="When to tune in"
              title="Schedule"
              cta="Match days"
              icon="calendar_month"
              accent="primary"
            />
          </li>
          <li>
            <HeroTile
              href="/knowledge"
              eyebrow="Get oriented"
              title="General knowledge"
              cta="Tournament"
              icon="info"
              accent="emerald"
            />
          </li>
        </ul>
      </section>

      {/* Modern Sports Venue Hub — dark map + synced bar list */}
      {hubVenues.length ? (
        <VenueHub
          venues={hubVenues}
          title={`Where to watch ${displayName} in SF`}
          eyebrow="Modern Sports Venue Hub"
        />
      ) : null}

      {/* Upcoming — full WC2026 schedule, filterable */}
      {allUpcoming.length ? (
        <section id="schedule">
          <SectionHeader title="Upcoming matches" eyebrow="2026 World Cup" />
          <MatchesGrid matches={allUpcoming} />
        </section>
      ) : null}

      {/* Standings */}
      {group ? (
        <section id="standings">
          <SectionHeader
            title={`Group ${group.letter} standings`}
            eyebrow="Tournament"
          />
          <StandingsTable
            groupLetter={group.letter}
            rows={groupRows}
            highlightCode={pickedCode}
          />
          <p className="mt-stack-md text-body-sm text-on-surface-variant">
            <em>Standings populate once the group stage begins.</em>
          </p>
        </section>
      ) : null}

      {/* Official supporter bars */}
      {officialBars.length ? (
        <section id="bars">
          <SectionHeader
            title={`Official ${displayName} bars`}
            eyebrow="Where the supporters go"
          />
          <ul role="list" className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            {officialBars.map((b) => {
              const verdict = occupancyVerdict({
                demandTier: country?.fan_demand_tier ?? null,
                affinityRole: b.role,
                minutesToKickoff: minsToNext,
                liveConfidence: null,
              });
              const data: BarCardData = {
                id: b.venue.id,
                name: b.venue.name,
                neighborhood: b.venue.neighborhood,
                address: b.venue.address,
                photoUrl: b.venue.photo_url,
                isOfficial: true,
                teamLabel: displayName.toUpperCase(),
                walkingTime: null,
                occupancy: verdict,
              };
              return (
                <li key={b.venue.id}>
                  <BarCard bar={data} variant="featured" />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Other relevant bars */}
      {otherBars.length ? (
        <section>
          <SectionHeader
            title="Other bars showing the match"
            eyebrow="Casual viewing"
          />
          <ul role="list" className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            {otherBars.map((b) => {
              const verdict = occupancyVerdict({
                demandTier: country?.fan_demand_tier ?? null,
                affinityRole: b.role,
                minutesToKickoff: minsToNext,
                liveConfidence: null,
              });
              const data: BarCardData = {
                id: b.venue.id,
                name: b.venue.name,
                neighborhood: b.venue.neighborhood,
                address: b.venue.address,
                photoUrl: b.venue.photo_url,
                isOfficial: false,
                teamLabel: null,
                walkingTime: null,
                occupancy: verdict,
              };
              return (
                <li key={b.venue.id}>
                  <BarCard bar={data} variant="compact" />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Public watch parties / fan zones */}
      {fanZones.length ? (
        <section id="venues">
          <SectionHeader
            title="Where the city watches together"
            eyebrow="Public · FIFA-official"
          />
          <ul role="list" className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
            {fanZones.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/venues/${v.id}`}
                  className="group flex h-full flex-col gap-stack-md rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg transition hover:-translate-y-[1px] hover:border-primary hover:shadow-ambient"
                >
                  <Chip tone="primary" size="sm" icon="verified">
                    Official
                  </Chip>
                  <h3 className="text-headline-md text-on-surface group-hover:text-primary">
                    {v.name}
                  </h3>
                  <p className="text-body-sm text-on-surface-variant">
                    {v.address}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Bracket */}
      <section id="bracket">
        <SectionHeader
          title="Knockout bracket"
          eyebrow="From group stage to final"
        />
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg">
          <KnockoutBracket />
        </div>
      </section>
    </main>
  );
}
