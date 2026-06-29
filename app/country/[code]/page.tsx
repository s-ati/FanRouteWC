import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BarCard, { type BarCardData } from "@/components/BarCard";
import Chip from "@/components/Chip";
import MatchHero from "@/components/MatchHero";
import SectionHeader from "@/components/SectionHeader";
import TeamIdentityHero from "@/components/TeamIdentityHero";
import StandingsTable, { type StandingsRow } from "@/components/StandingsTable";
import MatchesGrid from "@/components/MatchesGrid";
import { COUNTRY_COOKIE, readPickedCountry } from "@/lib/country-cookie";
import { occupancyVerdict } from "@/lib/crowd/occupancy-copy";
import { flagEmoji } from "@/lib/flags";
import {
  getAllFixtures,
  getCountryByCode,
  getFanZonesByIds,
  getRankedBarsForCountry,
} from "@/lib/queries";
import type { Fixture } from "@/lib/types";
import { teamHeroImages } from "@/lib/team-imagery";
import { demoBarPhotoFor } from "@/lib/demo-bar-photos";
import { mergeFixturesIntoSchedule } from "@/lib/wc2026-matches";
import {
  findGroupForTeam,
  getScheduleAsMatchCards,
  scheduleAsFixtures,
} from "@/lib/wc2026-schedule";
import { computeStandings } from "@/lib/groups";
import { SF_OFFICIAL_FAN_ZONES, getTeamByCode } from "@/lib/wc2026-teams";

export const revalidate = 60;

async function setCountryAction(formData: FormData) {
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
  redirect(`/country/${code}`);
}

async function clearCountryAction() {
  "use server";
  const store = await cookies();
  store.delete(COUNTRY_COOKIE);
  redirect("/onboarding");
}

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

export default async function CountryDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  const team = getTeamByCode(upperCode);
  const country = await getCountryByCode(upperCode);
  // Only the 48 qualified WC2026 teams get a country page. Some stale rows
  // (IRL, ITA, NGA — removed from the team list when they didn't qualify) may
  // still exist in Supabase; don't surface them.
  if (!team) notFound();

  const displayName = country?.name ?? team?.name ?? upperCode;
  const fanZoneIds = country?.fan_zones?.length
    ? country.fan_zones
    : SF_OFFICIAL_FAN_ZONES;

  const [bars, fanZones, picked, allFixtures] = await Promise.all([
    getRankedBarsForCountry(upperCode),
    getFanZonesByIds(fanZoneIds),
    readPickedCountry(),
    getAllFixtures().catch((): Fixture[] => []),
  ]);

  const isPicked = picked === upperCode;
  const flag = flagEmoji(upperCode);

  const teamFixtures = fixturesForTeam(allFixtures, upperCode);
  const teamUpcoming = teamFixtures.filter(
    (f) => new Date(f.kickoff_utc).getTime() >= Date.now(),
  );
  const next = teamUpcoming[0];
  const minsToNext = next ? minutesToKickoff(next) : null;

  // Full WC2026 tournament — 104 matches from the static schedule,
  // overlaid with Supabase kickoff times where available. Pre-filtered to
  // this country via MatchesGrid's defaultTeamFilter prop.
  const allMerged = mergeFixturesIntoSchedule(
    getScheduleAsMatchCards(),
    allFixtures,
  );
  const allUpcoming = allMerged.filter(
    (m) => new Date(m.kickoffUtc).getTime() >= Date.now(),
  );

  // Hero next-match comes from the FULL schedule, not just SF-seeded fixtures,
  // so every team still alive (e.g. USA in the Round of 32) shows its next
  // game. "Next" = earliest match for this team that has no final score yet.
  const nextCard =
    allMerged
      .filter((m) => m.homeCode === upperCode || m.awayCode === upperCode)
      .filter((m) => !m.result)
      .sort(
        (a, b) =>
          new Date(a.kickoffUtc).getTime() - new Date(b.kickoffUtc).getTime(),
      )[0] ?? null;
  const nextCardCountdown = nextCard
    ? (() => {
        const ms = new Date(nextCard.kickoffUtc).getTime() - Date.now();
        if (ms <= 0) return "Kicked off";
        const mins = Math.floor(ms / 60000);
        if (mins < 60) return `in ${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 48) return `in ${hours}h`;
        return `in ${Math.floor(hours / 24)}d`;
      })()
    : "";

  const group = findGroupForTeam(upperCode);
  const standings = group
    ? computeStandings(group.teams, scheduleAsFixtures())
    : [];
  const groupRows: StandingsRow[] = standings.map((s) => ({
    countryCode: s.code,
    name: getTeamByCode(s.code)?.name ?? s.code,
    played: s.played,
    wins: s.wins,
    draws: s.draws,
    losses: s.losses,
    goalDiff: s.goalDiff,
    points: s.points,
  }));

  const officialBars = bars.filter((b) => b.role === "home_bar");
  const otherBars = bars.filter((b) => b.role !== "home_bar");

  return (
    <main className="mx-auto max-w-7xl space-y-section-gap px-container-padding py-section-gap">
      {/* Eyebrow + actions */}
      <section>
        <Link
          href="/onboarding"
          className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary"
        >
          ← ALL TEAMS
        </Link>

        <div className="mt-stack-md flex flex-wrap items-center gap-5">
          <span aria-hidden className="text-6xl leading-none md:text-7xl">
            {flag || "🏳️"}
          </span>
          <h1 className="text-display-xl text-on-surface">{displayName}</h1>
        </div>

        <div className="mt-stack-lg flex flex-wrap items-center gap-3">
          {isPicked ? (
            <form action={clearCountryAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md border border-outline-variant bg-surface-container-lowest px-5 py-3 text-body-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
              >
                ✓ Following — clear
              </button>
            </form>
          ) : (
            <form action={setCountryAction}>
              <input type="hidden" name="country_code" value={upperCode} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-body-main font-semibold text-on-primary shadow-ambient transition hover:bg-primary-container"
              >
                Follow {displayName}
                <span className="material-symbols-outlined" aria-hidden>
                  arrow_forward
                </span>
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Hero — next match from the full schedule (or identity fallback when
          the team has been eliminated and has no upcoming game). */}
      {nextCard ? (
        <MatchHero
          data={{
            matchId: nextCard.matchId,
            homeCode: nextCard.homeCode,
            awayCode: nextCard.awayCode,
            stage: nextCard.group,
            countdownText: nextCardCountdown,
            kickoffLocal: nextCard.timeLabel
              ? `${nextCard.dateLabel} · ${nextCard.timeLabel}`
              : nextCard.dateLabel,
            hostStadium: nextCard.isBayArea
              ? "Levi's Stadium"
              : (nextCard.stadium ?? null),
            backgroundImages: teamHeroImages(upperCode),
            ctaLabel: "Where to watch →",
            ctaHref: `/matches/${nextCard.matchId}`,
            eyebrow: `${displayName.toUpperCase()}'S NEXT MATCH`,
          }}
        />
      ) : (
        <TeamIdentityHero
          data={{
            code: upperCode,
            displayName,
            eyebrow: displayName.toUpperCase(),
            tagline:
              "This team's tournament is over — no upcoming match. Browse the full schedule for the rest of the bracket.",
            backgroundImages: teamHeroImages(upperCode),
            ctaLabel: "Browse the schedule",
            ctaHref: "/#schedule",
          }}
        />
      )}

      {/* Upcoming — pre-filtered to this country, dropdown widens scope */}
      {allUpcoming.length ? (
        <section>
          <SectionHeader
            title={`Upcoming ${displayName} matches`}
            eyebrow="Schedule"
          />
          <MatchesGrid
            matches={allUpcoming}
            defaultTeamFilter={upperCode}
          />
        </section>
      ) : null}

      {/* Standings */}
      {group ? (
        <section>
          <SectionHeader
            title={`Group ${group.letter} standings`}
            eyebrow="Tournament"
          />
          <StandingsTable
            groupLetter={group.letter}
            rows={groupRows}
            highlightCode={upperCode}
          />
          <p className="mt-stack-md text-body-sm text-on-surface-variant">
            <em>Standings populate once the group stage begins.</em>
          </p>
        </section>
      ) : null}

      {/* Official bars */}
      {officialBars.length ? (
        <section>
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
                photoUrl: demoBarPhotoFor(b.venue.id, b.venue.photo_url),
                isOfficial: true,
                teamLabel: displayName.toUpperCase(),
                walkingTime: null,
                occupancy: verdict,
              };
              return (
                <li key={b.venue.id}>
                  <BarCard bar={data} variant="featured" flagFallback={flag} />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Other bars */}
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
                photoUrl: demoBarPhotoFor(b.venue.id, b.venue.photo_url),
                isOfficial: false,
                teamLabel: null,
                walkingTime: null,
                occupancy: verdict,
              };
              return (
                <li key={b.venue.id}>
                  <BarCard bar={data} variant="compact" flagFallback={flag} />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Public watch parties / fan zones */}
      {fanZones.length ? (
        <section>
          <SectionHeader
            title="Where the city watches together"
            eyebrow="Public · FIFA-official"
          />
          <ul
            role="list"
            className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3"
          >
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
    </main>
  );
}
