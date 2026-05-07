import Link from "next/link";
import StandingsTable, { type StandingsRow } from "@/components/StandingsTable";
import { readPickedCountry } from "@/lib/country-cookie";
import { getAllGroups } from "@/lib/wc2026-schedule";
import { getTeamByCode } from "@/lib/wc2026-teams";

export const revalidate = 60;

export default async function StandingsPage() {
  const pickedCode = await readPickedCountry();
  const groups = getAllGroups();

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
          Group stage
        </p>
        <h1 className="mt-stack-md text-display-xl text-on-surface">
          All standings
        </h1>
        <p className="mt-stack-md max-w-2xl text-body-main text-on-surface-variant">
          Twelve groups of four. The top two from each plus the eight best
          third-place finishers advance to the Round of 32. Standings populate
          once the group stage begins.
        </p>
      </header>

      <ul role="list" className="grid grid-cols-1 gap-gutter md:grid-cols-2">
        {groups.map((g) => {
          const rows: StandingsRow[] = g.teams.map((c) => ({
            countryCode: c,
            name: getTeamByCode(c)?.name ?? c,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalDiff: 0,
            points: 0,
          }));
          return (
            <li key={g.letter}>
              <StandingsTable
                groupLetter={g.letter}
                rows={rows}
                highlightCode={pickedCode}
              />
            </li>
          );
        })}
      </ul>
    </main>
  );
}
