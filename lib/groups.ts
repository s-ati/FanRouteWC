import type { Fixture } from "./types";

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
