// Final scores for completed WC2026 matches.
//
// Sourced from CBS Sports' running standings + results page, mirrored to
// the schedule constant by matchId. Add an entry here as matches finish;
// the standings table on /knowledge, the home group panel, and every
// MatchCard automatically pick up the new result.
//
// Last verified: 2026-06-15 (through Jun 14 group-stage matches).

export type MatchResult = {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
};

const ENTRIES: MatchResult[] = [
  // Day 1 — Thu Jun 11 — Group A
  { matchId: "M1",  homeGoals: 2, awayGoals: 0 }, // MEX 2-0 RSA
  { matchId: "M2",  homeGoals: 2, awayGoals: 1 }, // KOR 2-1 CZE

  // Day 2 — Fri Jun 12 — Groups B, D
  { matchId: "M3",  homeGoals: 1, awayGoals: 1 }, // CAN 1-1 BIH
  { matchId: "M4",  homeGoals: 4, awayGoals: 1 }, // USA 4-1 PAR

  // Day 3 — Sat Jun 13 — Groups C, D, B
  { matchId: "M5",  homeGoals: 0, awayGoals: 1 }, // SCO 1-0 HAI (HAI home in schedule)
  { matchId: "M6",  homeGoals: 2, awayGoals: 0 }, // AUS 2-0 TUR
  { matchId: "M7",  homeGoals: 1, awayGoals: 1 }, // BRA 1-1 MAR
  { matchId: "M8",  homeGoals: 1, awayGoals: 1 }, // QAT 1-1 SUI

  // Day 4 — Sun Jun 14 — Groups E, H
  { matchId: "M9",  homeGoals: 1, awayGoals: 0 }, // CIV 1-0 ECU
  { matchId: "M10", homeGoals: 7, awayGoals: 1 }, // GER 7-1 CUW
  { matchId: "M11", homeGoals: 2, awayGoals: 2 }, // NED 2-2 JPN
  { matchId: "M12", homeGoals: 5, awayGoals: 1 }, // SWE 5-1 TUN
];

const BY_ID: Map<string, MatchResult> = new Map(
  ENTRIES.map((e) => [e.matchId, e]),
);

export const MATCH_RESULTS: MatchResult[] = ENTRIES;

export function getResultByMatchId(matchId: string): MatchResult | null {
  return BY_ID.get(matchId) ?? null;
}

export function isCompleted(matchId: string): boolean {
  return BY_ID.has(matchId);
}
