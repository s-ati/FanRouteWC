import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import KnockoutBracket from "@/components/KnockoutBracket";
import MatchHero from "@/components/MatchHero";
import MatchesGrid from "@/components/MatchesGrid";
import StandingsTable, { type StandingsRow } from "@/components/StandingsTable";
import BarCard, { type BarCardData } from "@/components/BarCard";
import SectionHeader from "@/components/SectionHeader";
import Chip from "@/components/Chip";
import TeamPicker from "@/components/TeamPicker";
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
import { groupFromStage } from "@/lib/groups";
import { fixtureToMatchData } from "@/lib/wc2026-matches";
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

function findTeamGroup(all: Fixture[], code: string): {
  letter: string;
  teams: string[];
} | null {
  const upper = code.toUpperCase();
  for (const f of all) {
    const g = groupFromStage(f.stage);
    if (!g) continue;
    if (f.home_team !== upper && f.away_team !== upper) continue;
    // Found this team's group — collect all teams playing in that group letter.
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

  // "Upcoming Matches" section now shows ALL upcoming WC matches by default;
  // the picked team is still highlighted via the hero above.
  const allUpcoming = allFixtures
    .filter((f) => new Date(f.kickoff_utc).getTime() >= Date.now())
    .sort(
      (a, b) =>
        new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime(),
    )
    .map(fixtureToMatchData);

  const group = findTeamGroup(allFixtures, pickedCode);
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
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg">
          <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
            No upcoming {displayName} match
          </p>
          <p className="mt-stack-sm text-body-main text-on-surface-variant">
            We&apos;ll put their next fixture here as soon as the schedule
            confirms.
          </p>
        </div>
      )}

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
