import type { Fixture } from "./types";
import { getResultByMatchId } from "./wc2026-results";

// Standings row derived from completed match results.
export type StandingsLine = {
  code: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

// Compute standings for a set of teams given a fixture list. Only matches
// with a result in MATCH_RESULTS contribute. Sort: points desc → GD desc
// → GF desc → alphabetical.
export function computeStandings(
  teams: string[],
  fixtures: Fixture[],
): StandingsLine[] {
  const lines = new Map<string, StandingsLine>();
  for (const code of teams) {
    lines.set(code, {
      code,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    });
  }

  for (const f of fixtures) {
    const r = getResultByMatchId(f.match_id);
    if (!r) continue;
    const home = lines.get(f.home_team);
    const away = lines.get(f.away_team);
    if (!home || !away) continue;
    home.played++;
    away.played++;
    home.goalsFor += r.homeGoals;
    home.goalsAgainst += r.awayGoals;
    away.goalsFor += r.awayGoals;
    away.goalsAgainst += r.homeGoals;
    if (r.homeGoals > r.awayGoals) {
      home.wins++;
      home.points += 3;
      away.losses++;
    } else if (r.homeGoals < r.awayGoals) {
      away.wins++;
      away.points += 3;
      home.losses++;
    } else {
      home.draws++;
      away.draws++;
      home.points += 1;
      away.points += 1;
    }
  }

  return Array.from(lines.values())
    .map((l) => ({ ...l, goalDiff: l.goalsFor - l.goalsAgainst }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.code.localeCompare(b.code);
    });
}

export const GROUP_LETTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
] as const;

export type GroupLetter = (typeof GROUP_LETTERS)[number];

export function groupFromStage(stage: string): GroupLetter | null {
  if (!stage.startsWith("group-")) return null;
  const letter = stage.slice(-1).toUpperCase() as GroupLetter;
  return GROUP_LETTERS.includes(letter) ? letter : null;
}

export type GroupSummary = {
  letter: GroupLetter;
  teams: string[];
  fixtures: Fixture[];
};

// Teams that belong to a group but don't appear in any SF-scoped fixture.
// The app derives group rosters from fixtures; this fills the gap so the
// group cards show the full real-world roster.
const EXTRA_GROUP_TEAMS: Partial<Record<GroupLetter, string[]>> = {
  B: ["BIH", "CAN"],
};

export function buildGroupSummaries(fixtures: Fixture[]): GroupSummary[] {
  const byGroup = new Map<GroupLetter, Fixture[]>();
  for (const f of fixtures) {
    const g = groupFromStage(f.stage);
    if (!g) continue;
    const list = byGroup.get(g) ?? [];
    list.push(f);
    byGroup.set(g, list);
  }

  return GROUP_LETTERS.filter(
    (g) => byGroup.has(g) || (EXTRA_GROUP_TEAMS[g]?.length ?? 0) > 0,
  ).map((letter) => {
    const groupFixtures = (byGroup.get(letter) ?? []).sort(
      (a, b) =>
        new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime(),
    );
    const teams = Array.from(
      new Set([
        ...groupFixtures.flatMap((f) => [f.home_team, f.away_team]),
        ...(EXTRA_GROUP_TEAMS[letter] ?? []),
      ]),
    ).sort();
    return { letter, teams, fixtures: groupFixtures };
  });
}
