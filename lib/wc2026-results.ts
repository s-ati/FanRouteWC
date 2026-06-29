// Final scores for completed WC2026 matches.
//
// Sourced from CBS Sports' running standings + results page, mirrored to
// the schedule constant by matchId. Add an entry here as matches finish;
// the standings table on /knowledge, the home group panel, and every
// MatchCard automatically pick up the new result.
//
// Last verified: 2026-06-28 — all 72 group-stage matches complete.
// Source: en.wikipedia.org/wiki/2026_FIFA_World_Cup (group-stage results
// tables). Scores are oriented to the home/away order in WC2026_SCHEDULE,
// which can differ from Wikipedia's listing order (e.g. M51 is CAN v SUI in
// the schedule, listed as Switzerland v Canada on Wikipedia).

export type MatchResult = {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
};

const ENTRIES: MatchResult[] = [
  // ── Group stage (M1–M72) — complete ──────────────────────────────────────
  { matchId: "M1", homeGoals: 2, awayGoals: 0 }, // MEX 2-0 RSA
  { matchId: "M2", homeGoals: 2, awayGoals: 1 }, // KOR 2-1 CZE
  { matchId: "M3", homeGoals: 1, awayGoals: 1 }, // CAN 1-1 BIH
  { matchId: "M4", homeGoals: 4, awayGoals: 1 }, // USA 4-1 PAR
  { matchId: "M5", homeGoals: 0, awayGoals: 1 }, // HAI 0-1 SCO
  { matchId: "M6", homeGoals: 2, awayGoals: 0 }, // AUS 2-0 TUR
  { matchId: "M7", homeGoals: 1, awayGoals: 1 }, // BRA 1-1 MAR
  { matchId: "M8", homeGoals: 1, awayGoals: 1 }, // QAT 1-1 SUI
  { matchId: "M9", homeGoals: 1, awayGoals: 0 }, // CIV 1-0 ECU
  { matchId: "M10", homeGoals: 7, awayGoals: 1 }, // GER 7-1 CUW
  { matchId: "M11", homeGoals: 2, awayGoals: 2 }, // NED 2-2 JPN
  { matchId: "M12", homeGoals: 5, awayGoals: 1 }, // SWE 5-1 TUN
  { matchId: "M13", homeGoals: 0, awayGoals: 0 }, // ESP 0-0 CPV
  { matchId: "M14", homeGoals: 1, awayGoals: 1 }, // KSA 1-1 URU
  { matchId: "M15", homeGoals: 1, awayGoals: 1 }, // BEL 1-1 EGY
  { matchId: "M16", homeGoals: 2, awayGoals: 2 }, // IRN 2-2 NZL
  { matchId: "M17", homeGoals: 3, awayGoals: 1 }, // FRA 3-1 SEN
  { matchId: "M18", homeGoals: 1, awayGoals: 4 }, // IRQ 1-4 NOR
  { matchId: "M19", homeGoals: 3, awayGoals: 0 }, // ARG 3-0 ALG
  { matchId: "M20", homeGoals: 3, awayGoals: 1 }, // AUT 3-1 JOR
  { matchId: "M21", homeGoals: 4, awayGoals: 2 }, // ENG 4-2 CRO
  { matchId: "M22", homeGoals: 1, awayGoals: 0 }, // GHA 1-0 PAN
  { matchId: "M23", homeGoals: 1, awayGoals: 1 }, // POR 1-1 COD
  { matchId: "M24", homeGoals: 1, awayGoals: 3 }, // UZB 1-3 COL
  { matchId: "M25", homeGoals: 1, awayGoals: 1 }, // CZE 1-1 RSA
  { matchId: "M26", homeGoals: 4, awayGoals: 1 }, // SUI 4-1 BIH
  { matchId: "M27", homeGoals: 6, awayGoals: 0 }, // CAN 6-0 QAT
  { matchId: "M28", homeGoals: 1, awayGoals: 0 }, // MEX 1-0 KOR
  { matchId: "M29", homeGoals: 3, awayGoals: 0 }, // BRA 3-0 HAI
  { matchId: "M30", homeGoals: 0, awayGoals: 1 }, // SCO 0-1 MAR
  { matchId: "M31", homeGoals: 0, awayGoals: 1 }, // TUR 0-1 PAR
  { matchId: "M32", homeGoals: 2, awayGoals: 0 }, // USA 2-0 AUS
  { matchId: "M33", homeGoals: 2, awayGoals: 1 }, // GER 2-1 CIV
  { matchId: "M34", homeGoals: 0, awayGoals: 0 }, // ECU 0-0 CUW
  { matchId: "M35", homeGoals: 5, awayGoals: 1 }, // NED 5-1 SWE
  { matchId: "M36", homeGoals: 0, awayGoals: 4 }, // TUN 0-4 JPN
  { matchId: "M37", homeGoals: 4, awayGoals: 0 }, // ESP 4-0 KSA
  { matchId: "M38", homeGoals: 2, awayGoals: 2 }, // URU 2-2 CPV
  { matchId: "M39", homeGoals: 0, awayGoals: 0 }, // BEL 0-0 IRN
  { matchId: "M40", homeGoals: 1, awayGoals: 3 }, // NZL 1-3 EGY
  { matchId: "M41", homeGoals: 3, awayGoals: 0 }, // FRA 3-0 IRQ
  { matchId: "M42", homeGoals: 3, awayGoals: 2 }, // NOR 3-2 SEN
  { matchId: "M43", homeGoals: 2, awayGoals: 0 }, // ARG 2-0 AUT
  { matchId: "M44", homeGoals: 1, awayGoals: 2 }, // JOR 1-2 ALG
  { matchId: "M45", homeGoals: 0, awayGoals: 0 }, // ENG 0-0 GHA
  { matchId: "M46", homeGoals: 0, awayGoals: 1 }, // PAN 0-1 CRO
  { matchId: "M47", homeGoals: 5, awayGoals: 0 }, // POR 5-0 UZB
  { matchId: "M48", homeGoals: 1, awayGoals: 0 }, // COL 1-0 COD
  { matchId: "M49", homeGoals: 0, awayGoals: 3 }, // SCO 0-3 BRA
  { matchId: "M50", homeGoals: 4, awayGoals: 2 }, // MAR 4-2 HAI
  { matchId: "M51", homeGoals: 1, awayGoals: 2 }, // CAN 1-2 SUI
  { matchId: "M52", homeGoals: 3, awayGoals: 1 }, // BIH 3-1 QAT
  { matchId: "M53", homeGoals: 3, awayGoals: 0 }, // MEX 3-0 CZE
  { matchId: "M54", homeGoals: 0, awayGoals: 1 }, // KOR 0-1 RSA
  { matchId: "M55", homeGoals: 2, awayGoals: 1 }, // ECU 2-1 GER
  { matchId: "M56", homeGoals: 0, awayGoals: 2 }, // CUW 0-2 CIV
  { matchId: "M57", homeGoals: 1, awayGoals: 3 }, // TUN 1-3 NED
  { matchId: "M58", homeGoals: 1, awayGoals: 1 }, // JPN 1-1 SWE
  { matchId: "M59", homeGoals: 2, awayGoals: 3 }, // USA 2-3 TUR
  { matchId: "M60", homeGoals: 0, awayGoals: 0 }, // PAR 0-0 AUS
  { matchId: "M61", homeGoals: 1, awayGoals: 4 }, // NOR 1-4 FRA
  { matchId: "M62", homeGoals: 5, awayGoals: 0 }, // SEN 5-0 IRQ
  { matchId: "M63", homeGoals: 1, awayGoals: 5 }, // NZL 1-5 BEL
  { matchId: "M64", homeGoals: 1, awayGoals: 1 }, // EGY 1-1 IRN
  { matchId: "M65", homeGoals: 0, awayGoals: 1 }, // URU 0-1 ESP
  { matchId: "M66", homeGoals: 0, awayGoals: 0 }, // CPV 0-0 KSA
  { matchId: "M67", homeGoals: 0, awayGoals: 2 }, // PAN 0-2 ENG
  { matchId: "M68", homeGoals: 2, awayGoals: 1 }, // CRO 2-1 GHA
  { matchId: "M69", homeGoals: 1, awayGoals: 3 }, // JOR 1-3 ARG
  { matchId: "M70", homeGoals: 3, awayGoals: 3 }, // ALG 3-3 AUT
  { matchId: "M71", homeGoals: 0, awayGoals: 0 }, // COL 0-0 POR
  { matchId: "M72", homeGoals: 3, awayGoals: 1 }, // COD 3-1 UZB
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
