// Full WC2026 schedule — 72 group-stage + 32 knockout matches.
// Source of truth: Sammy/05-project-notes/fanroute/data/wc2026-schedule.md
//
// Group letter assignments:
//   A: Mexico's group   B: Canada's group   D: USA's group   E: Germany's group
//   The remaining eight (C, F, G, H, I, J, K, L) are seeded against the user's
//   knockout-bracket references. Refresh once the official draw is published.
//
// Kickoff times are placeholders (19:00 UTC == 12:00 PT) until per-stadium
// time slots are confirmed. The card UI reads dateLabel as primary signal.

import { stadiumImageryById } from "./stadium-imagery";
import { stageLabel } from "./matchday";
import { getStadiumById } from "./wc2026-stadiums";
import { getTeamByCode } from "./wc2026-teams";
import type { MatchCardData } from "./wc2026-matches";

export type ScheduleStage =
  | "group-a" | "group-b" | "group-c" | "group-d"
  | "group-e" | "group-f" | "group-g" | "group-h"
  | "group-i" | "group-j" | "group-k" | "group-l"
  | "r32" | "r16" | "qf" | "sf" | "third-place" | "final";

export type ScheduleEntry = {
  matchId: string;             // "M1"–"M104" (matches Supabase fixture id)
  stage: ScheduleStage;
  homeCode: string;            // 3-letter FIFA code OR placeholder ("1A", "W73")
  awayCode: string;
  homeLabel?: string;          // Override for placeholders ("Group A winner")
  awayLabel?: string;
  dateIso: string;             // YYYY-MM-DD
  stadiumId: string;
};

const PLACEHOLDER_TIME = "T19:00:00Z";

const g = (n: number, stage: ScheduleStage, home: string, away: string, date: string, stadium: string): ScheduleEntry => ({
  matchId: `M${n}`,
  stage,
  homeCode: home,
  awayCode: away,
  dateIso: date,
  stadiumId: stadium,
});

const k = (
  n: number,
  stage: ScheduleStage,
  home: string,
  homeLabel: string,
  away: string,
  awayLabel: string,
  date: string,
  stadium: string,
): ScheduleEntry => ({
  matchId: `M${n}`,
  stage,
  homeCode: home,
  awayCode: away,
  homeLabel,
  awayLabel,
  dateIso: date,
  stadiumId: stadium,
});

// ---------------------------------------------------------------------------
// Group stage (72) — derived from match-day list. Group letters A/B/D/E are
// fixed by host seeding (and the user's prior Germany=E request); C/F/G/H/I/
// J/K/L are placeholder assignments and may need re-letter when the official
// draw lands.
//
// Group A: MEX, RSA, KOR, CZE
// Group B: CAN, BIH, SUI, QAT
// Group C: BRA, MAR, HAI, SCO
// Group D: USA, PAR, AUS, TUR
// Group E: GER, CUW, CIV, ECU
// Group F: ESP, CPV, KSA, URU
// Group G: BEL, EGY, IRN, NZL
// Group H: NED, JPN, SWE, TUN
// Group I: FRA, SEN, IRQ, NOR
// Group J: ARG, ALG, AUT, JOR
// Group K: ENG, CRO, GHA, PAN
// Group L: POR, COD, UZB, COL

export const WC2026_SCHEDULE: ScheduleEntry[] = [
  // ── Day 1 — Thu Jun 11 ───────────────────────────────────────────────────
  g(  1, "group-a", "MEX", "RSA", "2026-06-11", "azteca-mexicocity"),
  g(  2, "group-a", "KOR", "CZE", "2026-06-11", "akron-guadalajara"),

  // ── Day 2 — Fri Jun 12 ───────────────────────────────────────────────────
  g(  3, "group-b", "CAN", "BIH", "2026-06-12", "bmofield-toronto"),
  g(  4, "group-d", "USA", "PAR", "2026-06-12", "sofi-la"),

  // ── Day 3 — Sat Jun 13 ───────────────────────────────────────────────────
  g(  5, "group-c", "HAI", "SCO", "2026-06-13", "gillette-boston"),
  g(  6, "group-d", "AUS", "TUR", "2026-06-13", "bcplace-vancouver"),
  g(  7, "group-c", "BRA", "MAR", "2026-06-13", "metlife-nynj"),
  g(  8, "group-b", "QAT", "SUI", "2026-06-13", "levis-bay-area"),

  // ── Day 4 — Sun Jun 14 ───────────────────────────────────────────────────
  g(  9, "group-e", "CIV", "ECU", "2026-06-14", "lincoln-philly"),
  g( 10, "group-e", "GER", "CUW", "2026-06-14", "nrg-houston"),
  g( 11, "group-h", "NED", "JPN", "2026-06-14", "att-dallas"),
  g( 12, "group-h", "SWE", "TUN", "2026-06-14", "bbva-monterrey"),

  // ── Day 5 — Mon Jun 15 ───────────────────────────────────────────────────
  g( 13, "group-f", "ESP", "CPV", "2026-06-15", "mb-atlanta"),
  g( 14, "group-f", "KSA", "URU", "2026-06-15", "hardrock-miami"),
  g( 15, "group-g", "BEL", "EGY", "2026-06-15", "lumen-seattle"),
  g( 16, "group-g", "IRN", "NZL", "2026-06-15", "sofi-la"),

  // ── Day 6 — Tue Jun 16 ───────────────────────────────────────────────────
  g( 17, "group-i", "FRA", "SEN", "2026-06-16", "metlife-nynj"),
  g( 18, "group-i", "IRQ", "NOR", "2026-06-16", "gillette-boston"),
  g( 19, "group-j", "ARG", "ALG", "2026-06-16", "arrowhead-kc"),
  g( 20, "group-j", "AUT", "JOR", "2026-06-16", "levis-bay-area"),

  // ── Day 7 — Wed Jun 17 ───────────────────────────────────────────────────
  g( 21, "group-k", "ENG", "CRO", "2026-06-17", "att-dallas"),
  g( 22, "group-k", "GHA", "PAN", "2026-06-17", "bmofield-toronto"),
  g( 23, "group-l", "POR", "COD", "2026-06-17", "nrg-houston"),
  g( 24, "group-l", "UZB", "COL", "2026-06-17", "azteca-mexicocity"),

  // ── Day 8 — Thu Jun 18 ───────────────────────────────────────────────────
  g( 25, "group-a", "CZE", "RSA", "2026-06-18", "mb-atlanta"),
  g( 26, "group-b", "SUI", "BIH", "2026-06-18", "sofi-la"),
  g( 27, "group-b", "CAN", "QAT", "2026-06-18", "bcplace-vancouver"),
  g( 28, "group-a", "MEX", "KOR", "2026-06-18", "akron-guadalajara"),

  // ── Day 9 — Fri Jun 19 ───────────────────────────────────────────────────
  g( 29, "group-c", "BRA", "HAI", "2026-06-19", "lincoln-philly"),
  g( 30, "group-c", "SCO", "MAR", "2026-06-19", "gillette-boston"),
  g( 31, "group-d", "TUR", "PAR", "2026-06-19", "levis-bay-area"),
  g( 32, "group-d", "USA", "AUS", "2026-06-19", "lumen-seattle"),

  // ── Day 10 — Sat Jun 20 ──────────────────────────────────────────────────
  g( 33, "group-e", "GER", "CIV", "2026-06-20", "bmofield-toronto"),
  g( 34, "group-e", "ECU", "CUW", "2026-06-20", "arrowhead-kc"),
  g( 35, "group-h", "NED", "SWE", "2026-06-20", "nrg-houston"),
  g( 36, "group-h", "TUN", "JPN", "2026-06-20", "bbva-monterrey"),

  // ── Day 11 — Sun Jun 21 ──────────────────────────────────────────────────
  g( 37, "group-f", "ESP", "KSA", "2026-06-21", "mb-atlanta"),
  g( 38, "group-f", "URU", "CPV", "2026-06-21", "hardrock-miami"),
  g( 39, "group-g", "BEL", "IRN", "2026-06-21", "sofi-la"),
  g( 40, "group-g", "NZL", "EGY", "2026-06-21", "bcplace-vancouver"),

  // ── Day 12 — Mon Jun 22 ──────────────────────────────────────────────────
  g( 41, "group-i", "FRA", "IRQ", "2026-06-22", "lincoln-philly"),
  g( 42, "group-i", "NOR", "SEN", "2026-06-22", "metlife-nynj"),
  g( 43, "group-j", "ARG", "AUT", "2026-06-22", "att-dallas"),
  g( 44, "group-j", "JOR", "ALG", "2026-06-22", "levis-bay-area"),

  // ── Day 13 — Tue Jun 23 ──────────────────────────────────────────────────
  g( 45, "group-k", "ENG", "GHA", "2026-06-23", "gillette-boston"),
  g( 46, "group-k", "PAN", "CRO", "2026-06-23", "bmofield-toronto"),
  g( 47, "group-l", "POR", "UZB", "2026-06-23", "nrg-houston"),
  g( 48, "group-l", "COL", "COD", "2026-06-23", "akron-guadalajara"),

  // ── Day 14 — Wed Jun 24 ──────────────────────────────────────────────────
  g( 49, "group-c", "SCO", "BRA", "2026-06-24", "hardrock-miami"),
  g( 50, "group-c", "MAR", "HAI", "2026-06-24", "mb-atlanta"),
  g( 51, "group-b", "CAN", "SUI", "2026-06-24", "bcplace-vancouver"),
  g( 52, "group-b", "BIH", "QAT", "2026-06-24", "lumen-seattle"),
  g( 53, "group-a", "MEX", "CZE", "2026-06-24", "azteca-mexicocity"),
  g( 54, "group-a", "KOR", "RSA", "2026-06-24", "bbva-monterrey"),

  // ── Day 15 — Thu Jun 25 ──────────────────────────────────────────────────
  g( 55, "group-e", "ECU", "GER", "2026-06-25", "metlife-nynj"),
  g( 56, "group-e", "CUW", "CIV", "2026-06-25", "lincoln-philly"),
  g( 57, "group-h", "TUN", "NED", "2026-06-25", "arrowhead-kc"),
  g( 58, "group-h", "JPN", "SWE", "2026-06-25", "att-dallas"),
  g( 59, "group-d", "USA", "TUR", "2026-06-25", "sofi-la"),
  g( 60, "group-d", "PAR", "AUS", "2026-06-25", "levis-bay-area"),

  // ── Day 16 — Fri Jun 26 ──────────────────────────────────────────────────
  g( 61, "group-i", "NOR", "FRA", "2026-06-26", "gillette-boston"),
  g( 62, "group-i", "SEN", "IRQ", "2026-06-26", "bmofield-toronto"),
  g( 63, "group-g", "NZL", "BEL", "2026-06-26", "bcplace-vancouver"),
  g( 64, "group-g", "EGY", "IRN", "2026-06-26", "lumen-seattle"),
  g( 65, "group-f", "URU", "ESP", "2026-06-26", "akron-guadalajara"),
  g( 66, "group-f", "CPV", "KSA", "2026-06-26", "nrg-houston"),

  // ── Day 17 — Sat Jun 27 ──────────────────────────────────────────────────
  g( 67, "group-k", "PAN", "ENG", "2026-06-27", "metlife-nynj"),
  g( 68, "group-k", "CRO", "GHA", "2026-06-27", "lincoln-philly"),
  g( 69, "group-j", "JOR", "ARG", "2026-06-27", "att-dallas"),
  g( 70, "group-j", "ALG", "AUT", "2026-06-27", "arrowhead-kc"),
  g( 71, "group-l", "COL", "POR", "2026-06-27", "hardrock-miami"),
  g( 72, "group-l", "COD", "UZB", "2026-06-27", "mb-atlanta"),

  // ── Knockout — Round of 32 (16 matches, 73–88) ──────────────────────────
  k( 73, "r32", "2A", "Group A runner-up", "2B", "Group B runner-up", "2026-06-28", "sofi-la"),
  k( 74, "r32", "1E", "Group E winner",     "T3", "3rd-place team",   "2026-06-29", "gillette-boston"),
  k( 75, "r32", "1F", "Group F winner",     "2C", "Group C runner-up","2026-06-29", "bbva-monterrey"),
  k( 76, "r32", "1C", "Group C winner",     "2F", "Group F runner-up","2026-06-29", "nrg-houston"),
  k( 77, "r32", "1I", "Group I winner",     "T3", "3rd-place team",   "2026-06-30", "metlife-nynj"),
  k( 78, "r32", "2E", "Group E runner-up",  "2I", "Group I runner-up","2026-06-30", "lincoln-philly"),
  k( 79, "r32", "1A", "Group A winner",     "T3", "3rd-place team",   "2026-06-30", "azteca-mexicocity"),
  k( 80, "r32", "1L", "Group L winner",     "T3", "3rd-place team",   "2026-07-01", "mb-atlanta"),
  k( 81, "r32", "1D", "Group D winner",     "T3", "3rd-place team",   "2026-07-01", "levis-bay-area"),
  k( 82, "r32", "1G", "Group G winner",     "T3", "3rd-place team",   "2026-07-01", "lumen-seattle"),
  k( 83, "r32", "2K", "Group K runner-up",  "2L", "Group L runner-up","2026-07-02", "bmofield-toronto"),
  k( 84, "r32", "1H", "Group H winner",     "2J", "Group J runner-up","2026-07-02", "sofi-la"),
  k( 85, "r32", "1B", "Group B winner",     "T3", "3rd-place team",   "2026-07-02", "bcplace-vancouver"),
  k( 86, "r32", "1J", "Group J winner",     "2H", "Group H runner-up","2026-07-03", "hardrock-miami"),
  k( 87, "r32", "1K", "Group K winner",     "T3", "3rd-place team",   "2026-07-03", "arrowhead-kc"),
  k( 88, "r32", "2D", "Group D runner-up",  "2G", "Group G runner-up","2026-07-03", "att-dallas"),

  // ── Round of 16 (8 matches, 89–96) ───────────────────────────────────────
  k( 89, "r16", "W74", "Winner Match 74", "W77", "Winner Match 77", "2026-07-04", "lincoln-philly"),
  k( 90, "r16", "W73", "Winner Match 73", "W75", "Winner Match 75", "2026-07-04", "nrg-houston"),
  k( 91, "r16", "W76", "Winner Match 76", "W78", "Winner Match 78", "2026-07-05", "hardrock-miami"),
  k( 92, "r16", "W79", "Winner Match 79", "W80", "Winner Match 80", "2026-07-05", "azteca-mexicocity"),
  k( 93, "r16", "W83", "Winner Match 83", "W84", "Winner Match 84", "2026-07-06", "att-dallas"),
  k( 94, "r16", "W81", "Winner Match 81", "W82", "Winner Match 82", "2026-07-06", "lumen-seattle"),
  k( 95, "r16", "W86", "Winner Match 86", "W88", "Winner Match 88", "2026-07-07", "mb-atlanta"),
  k( 96, "r16", "W85", "Winner Match 85", "W87", "Winner Match 87", "2026-07-07", "bcplace-vancouver"),

  // ── Quarterfinals (4 matches, 97–100) ────────────────────────────────────
  k( 97, "qf", "W89", "Winner Match 89", "W90", "Winner Match 90", "2026-07-09", "gillette-boston"),
  k( 98, "qf", "W93", "Winner Match 93", "W94", "Winner Match 94", "2026-07-10", "att-dallas"),
  k( 99, "qf", "W91", "Winner Match 91", "W92", "Winner Match 92", "2026-07-11", "hardrock-miami"),
  k(100, "qf", "W95", "Winner Match 95", "W96", "Winner Match 96", "2026-07-11", "arrowhead-kc"),

  // ── Semifinals (2 matches, 101–102) ──────────────────────────────────────
  k(101, "sf", "W97", "Winner Match 97", "W98", "Winner Match 98", "2026-07-14", "att-dallas"),
  k(102, "sf", "W99", "Winner Match 99", "W100", "Winner Match 100", "2026-07-15", "mb-atlanta"),

  // ── Third-place (1) + Final (1) ──────────────────────────────────────────
  k(103, "third-place", "L101", "Loser Match 101", "L102", "Loser Match 102", "2026-07-18", "hardrock-miami"),
  k(104, "final",       "W101", "Winner Match 101","W102","Winner Match 102", "2026-07-19", "metlife-nynj"),
];

// Resolve a placeholder code (1A / 2B / W73 / T3 / L102) to a display label
// when the official team isn't known yet. Real 3-letter codes pass through
// to getTeamByCode.
function labelFor(code: string, fallback?: string): string {
  if (fallback) return fallback;
  const t = getTeamByCode(code);
  return t?.name ?? code;
}

export function scheduleEntryToMatchCardData(
  e: ScheduleEntry,
): MatchCardData {
  const stadium = getStadiumById(e.stadiumId);
  const imagery = stadiumImageryById(e.stadiumId);

  const date = new Date(`${e.dateIso}${PLACEHOLDER_TIME}`);
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
  // Date-anchored only (time TBD) — leave timeLabel blank so the card hides it.
  const timeLabel = "";

  return {
    matchId: e.matchId,
    group: stageLabel(e.stage).toUpperCase(),
    homeCode: e.homeCode,
    awayCode: e.awayCode,
    kickoffUtc: date.toISOString(),
    dateLabel,
    timeLabel,
    stadium: stadium?.name ?? imagery.stadium,
    city: stadium?.city ?? imagery.city,
    isBayArea: stadium?.isBayArea ?? false,
    backgroundUrl: imagery.imageUrl,
  };
}

// Resolve home/away display names for an entry (for prominent labels).
export function entryDisplayNames(e: ScheduleEntry): {
  homeName: string;
  awayName: string;
} {
  return {
    homeName: labelFor(e.homeCode, e.homeLabel),
    awayName: labelFor(e.awayCode, e.awayLabel),
  };
}

// Convenience: full schedule pre-converted to card data, sorted ascending.
export function getScheduleAsMatchCards(): MatchCardData[] {
  return WC2026_SCHEDULE.map(scheduleEntryToMatchCardData).sort(
    (a, b) =>
      new Date(a.kickoffUtc).getTime() - new Date(b.kickoffUtc).getTime(),
  );
}
