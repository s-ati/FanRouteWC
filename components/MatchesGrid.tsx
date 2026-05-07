"use client";

import { useMemo, useState } from "react";
import UpcomingMatchCard from "./UpcomingMatchCard";
import {
  filterMatches,
  teamsFromMatches,
  type MatchCardData,
} from "@/lib/wc2026-matches";
import { getTeamByCode } from "@/lib/wc2026-teams";

type Props = {
  matches: MatchCardData[];
  // When set, the dropdown initializes to this team and the grid is filtered.
  // Country routes pass their own code so the section auto-narrows.
  defaultTeamFilter?: string | null;
  // Hide the dropdown — useful when the surrounding page already conveys
  // the team context (e.g. a hero with the team name).
  hideFilter?: boolean;
};

export default function MatchesGrid({
  matches,
  defaultTeamFilter = null,
  hideFilter = false,
}: Props) {
  const initial = defaultTeamFilter?.toUpperCase() ?? "ALL";
  const [team, setTeam] = useState<string>(initial);

  const allTeams = useMemo(() => teamsFromMatches(matches), [matches]);

  const visible = useMemo(() => {
    if (team === "ALL") return matches;
    return filterMatches(matches, { team });
  }, [matches, team]);

  if (matches.length === 0) {
    return (
      <p className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg text-body-sm text-on-surface-variant">
        No upcoming matches yet — check back when the schedule updates.
      </p>
    );
  }

  return (
    <div>
      {!hideFilter ? (
        <div className="mb-stack-md flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
            Showing {visible.length} of {matches.length}
          </p>

          <label className="inline-flex items-center gap-2 text-body-sm text-on-surface-variant">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
              Filter by team
            </span>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-sm text-on-surface focus:border-primary focus:outline-none"
            >
              <option value="ALL">All teams</option>
              {allTeams.map((code) => {
                const name = getTeamByCode(code)?.name ?? code;
                return (
                  <option key={code} value={code}>
                    {name} ({code})
                  </option>
                );
              })}
            </select>
          </label>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg text-body-sm text-on-surface-variant">
          No upcoming matches for this team in the visible window.
        </p>
      ) : (
        <ul
          role="list"
          className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3"
        >
          {visible.map((m) => (
            <li key={m.matchId}>
              <UpcomingMatchCard data={m} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
