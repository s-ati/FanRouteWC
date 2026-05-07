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
  // 3-letter FIFA code (or "ALL"). When omitted, the grid defaults to
  // Germany — the section's brand-default team. Country routes pass their
  // own code so the route auto-narrows.
  defaultTeamFilter?: string | null;
  // Hide the dropdown when the surrounding page already conveys the team
  // context (e.g. a hero with the team name).
  hideFilter?: boolean;
};

const DEFAULT_TEAM = "GER";

export default function MatchesGrid({
  matches,
  defaultTeamFilter,
  hideFilter = false,
}: Props) {
  // Resolve the initial filter:
  //   - Caller passes a code → use it
  //   - Caller passes "ALL" → render all
  //   - Caller omits / passes null → default to Germany
  const initial = (() => {
    if (!defaultTeamFilter) return DEFAULT_TEAM;
    const upper = defaultTeamFilter.toUpperCase();
    return upper === "ALL" ? "ALL" : upper;
  })();

  const [team, setTeam] = useState<string>(initial);

  const allTeams = useMemo(() => teamsFromMatches(matches), [matches]);

  const visible = useMemo(() => {
    if (team === "ALL") return matches;
    // Always go through filterMatches — never render the global list
    // unfiltered when a team filter is active.
    return filterMatches(matches, { team });
  }, [matches, team]);

  if (matches.length === 0) {
    return (
      <p className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg text-body-sm text-on-surface-variant">
        No upcoming matches yet — check back when the schedule updates.
      </p>
    );
  }

  const featureTeam = team === "ALL" ? null : team;
  const featureName =
    featureTeam ? getTeamByCode(featureTeam)?.name ?? featureTeam : null;

  return (
    <div>
      {!hideFilter ? (
        <div className="mb-stack-md flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
            {featureName
              ? `Showing ${visible.length} ${featureName} ${visible.length === 1 ? "match" : "matches"}`
              : `Showing ${visible.length} of ${matches.length}`}
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
          No upcoming matches for {featureName ?? "this team"} in the visible
          window.
        </p>
      ) : (
        <ul
          role="list"
          className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3"
        >
          {visible.map((m) => (
            <li key={m.matchId}>
              <UpcomingMatchCard data={m} featureTeam={featureTeam} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
