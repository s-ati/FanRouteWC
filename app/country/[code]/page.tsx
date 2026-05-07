import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BarCard, { type BarCardData } from "@/components/BarCard";
import Chip from "@/components/Chip";
import MatchHero from "@/components/MatchHero";
import SectionHeader from "@/components/SectionHeader";
import StandingsTable, { type StandingsRow } from "@/components/StandingsTable";
import MatchesGrid from "@/components/MatchesGrid";
import { COUNTRY_COOKIE, readPickedCountry } from "@/lib/country-cookie";
import { occupancyVerdict } from "@/lib/crowd/occupancy-copy";
import { flagEmoji } from "@/lib/flags";
import { groupFromStage } from "@/lib/groups";
import {
  formatKickoffLocal,
  kickoffCountdown,
  stageLabel,
} from "@/lib/matchday";
import {
  getAllFixtures,
  getCountryByCode,
  getFanZonesByIds,
  getRankedBarsForCountry,
} from "@/lib/queries";
import type { Fixture } from "@/lib/types";
import { teamHeroImages } from "@/lib/team-imagery";
import { fixtureToMatchData } from "@/lib/wc2026-matches";
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

function findTeamGroup(all: Fixture[], code: string): {
  letter: string;
  teams: string[];
} | null {
  const upper = code.toUpperCase();
  for (const f of all) {
    const g = groupFromStage(f.stage);
    if (!g) continue;
    if (f.home_team !== upper && f.away_team !== upper) continue;
    const stagePrefix = `group-${g.toLowerCase()}`;
    const teams = new Set<string>();
    for (const x of all) {
      if (x.stage === stagePrefix) {
        teams.add(x.home_team);
        teams.add(x.away_team);
      }
    }
    return { letter: g, teams: Array.from(teams).sort() };
  }
  return null;
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
  if (!team && !country) notFound();

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

  // Pass the full upcoming schedule into MatchesGrid; the grid pre-filters to
  // this country, but the dropdown lets the visitor zoom out to all matches.
  const allUpcoming = allFixtures
    .filter((f) => new Date(f.kickoff_utc).getTime() >= Date.now())
    .sort(
      (a, b) =>
        new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime(),
    )
    .map(fixtureToMatchData);

  const group = findTeamGroup(allFixtures, upperCode);
  const groupRows: StandingsRow[] = group
    ? group.teams.map((c) => ({
        countryCode: c,
        name: getTeamByCode(c)?.name ?? c,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalDiff: 0,
        points: 0,
      }))
    : [];

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

      {/* Hero — next match */}
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
            backgroundImages: teamHeroImages(upperCode),
            ctaLabel: "Where to watch →",
            ctaHref: `/matches/${next.match_id}`,
            eyebrow: `${displayName.toUpperCase()}'S NEXT MATCH`,
          }}
        />
      ) : null}

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
                photoUrl: b.venue.photo_url,
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
                photoUrl: b.venue.photo_url,
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
