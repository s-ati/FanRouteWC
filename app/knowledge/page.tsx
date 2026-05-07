import Link from "next/link";
import KnockoutBracket from "@/components/KnockoutBracket";
import SectionHeader from "@/components/SectionHeader";
import StandingsTable, { type StandingsRow } from "@/components/StandingsTable";
import { buildGroupSummaries, GROUP_LETTERS } from "@/lib/groups";
import { getAllFixtures } from "@/lib/queries";
import { mergeFixturesIntoSchedule } from "@/lib/wc2026-matches";
import { getScheduleAsMatchCards, WC2026_SCHEDULE } from "@/lib/wc2026-schedule";
import { WC2026_STADIUMS } from "@/lib/wc2026-stadiums";
import { getTeamByCode } from "@/lib/wc2026-teams";
import { groupFromStage } from "@/lib/groups";
import type { Fixture } from "@/lib/types";

export const revalidate = 60;

// Build a synthetic Fixture[] from the static schedule for the standings
// derivation — uses team codes only, dates are placeholder.
function scheduleAsFixtures(): Fixture[] {
  return WC2026_SCHEDULE.filter((e) =>
    GROUP_LETTERS.includes(e.stage.replace("group-", "").toUpperCase() as
      | "A"
      | "B"
      | "C"
      | "D"
      | "E"
      | "F"
      | "G"
      | "H"
      | "I"
      | "J"
      | "K"
      | "L"),
  ).map((e) => ({
    match_id: e.matchId,
    city_id: "san-francisco",
    stage: e.stage,
    home_team: e.homeCode,
    away_team: e.awayCode,
    kickoff_local: `${e.dateIso}T19:00:00Z`,
    kickoff_utc: `${e.dateIso}T19:00:00Z`,
    played_in_bay_area: false,
    host_city: e.stadiumId,
    notes: null,
    last_verified: "2026-05-07",
  }));
}

export default async function KnowledgePage() {
  const supabaseFixtures = await getAllFixtures().catch((): Fixture[] => []);
  // Use Supabase fixtures where present, else fall back to schedule constant.
  // Standings only need group-stage entries with real team codes — both sources
  // satisfy that.
  const groupFixtures = supabaseFixtures.length
    ? supabaseFixtures.filter((f) => groupFromStage(f.stage))
    : scheduleAsFixtures();

  const groups = buildGroupSummaries(groupFixtures);

  // Quick stats for the header.
  const allCards = mergeFixturesIntoSchedule(
    getScheduleAsMatchCards(),
    supabaseFixtures,
  );
  const totalMatches = allCards.length;

  return (
    <main className="mx-auto max-w-7xl space-y-section-gap px-container-padding py-section-gap">
      <Link
        href="/"
        className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary"
      >
        ← BACK TO HOME
      </Link>

      <header>
        <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
          2026 World Cup
        </p>
        <h1 className="mt-stack-md text-display-xl text-on-surface">
          Tournament knowledge
        </h1>
        <p className="mt-stack-md max-w-2xl text-body-main text-on-surface-variant">
          The format, the groups, the bracket, and the 16 host cities — all in
          one place.
        </p>
      </header>

      {/* Quick facts */}
      <section className="grid grid-cols-2 gap-gutter md:grid-cols-4">
        <Stat label="Teams" value="48" />
        <Stat label="Groups" value={String(groups.length)} />
        <Stat label="Matches" value={String(totalMatches)} />
        <Stat label="Host stadiums" value={String(WC2026_STADIUMS.length)} />
      </section>

      {/* Format */}
      <section>
        <SectionHeader title="The format" eyebrow="At a glance" />
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          <FormatCard
            title="Group stage"
            body="48 teams in 12 groups of 4. Top two from each group advance, plus the eight best third-place teams — 32 teams in total reach the knockouts."
          />
          <FormatCard
            title="Knockout"
            body="Round of 32 → Round of 16 → Quarterfinals → Semifinals → Third-place match → Final. Single-elimination from June 28 through July 19, 2026."
          />
          <FormatCard
            title="Hosts"
            body="USA, Mexico, and Canada share hosting duties across 16 stadiums. The final is at MetLife Stadium (NY/NJ) on July 19."
          />
        </div>
      </section>

      {/* Standings */}
      <section>
        <SectionHeader
          title="Group standings"
          eyebrow="Updated as the tournament unfolds"
        />
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
          {groups.map((g) => {
            const rows: StandingsRow[] = g.teams.map((code) => ({
              countryCode: code,
              name: getTeamByCode(code)?.name ?? code,
              played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalDiff: 0,
              points: 0,
            }));
            return (
              <div key={g.letter}>
                <StandingsTable groupLetter={g.letter} rows={rows} />
              </div>
            );
          })}
        </div>
        <p className="mt-stack-md text-body-sm text-on-surface-variant">
          <em>Standings populate once group stage results land.</em>
        </p>
      </section>

      {/* Bracket */}
      <section>
        <SectionHeader title="Knockout bracket" eyebrow="From R32 to the final" />
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg">
          <KnockoutBracket />
        </div>
      </section>

      {/* Host stadiums */}
      <section>
        <SectionHeader title="Host stadiums" eyebrow="16 venues across three nations" />
        <ul
          role="list"
          className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3"
        >
          {WC2026_STADIUMS.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg"
            >
              <p className="text-headline-md text-on-surface">{s.name}</p>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                {s.city}
              </p>
              {s.isBayArea ? (
                <p className="mt-stack-sm font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                  San Francisco Bay Area host
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg">
      <p className="text-display-xl text-on-surface">{value}</p>
      <p className="mt-stack-sm text-label-caps font-bold uppercase tracking-[0.08em] text-on-surface-variant">
        {label}
      </p>
    </div>
  );
}

function FormatCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="h-full rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg">
      <h3 className="text-headline-md text-on-surface">{title}</h3>
      <p className="mt-stack-md text-body-main text-on-surface-variant">
        {body}
      </p>
    </div>
  );
}
