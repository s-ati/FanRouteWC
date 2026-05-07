// Centralized match data for the FanRoute "Upcoming Matches" section.
//
// MatchCardData is the shape every MatchCard renders. The app's live source
// of truth is the Supabase `fixtures` table — `fixtureToMatchData()` adapts
// a Fixture row into this shape. STARTER_MATCHES below is a small constant
// fallback so the UI still has something to show in dev/empty-DB scenarios.

import type { Fixture } from "./types";
import { groupFromStage } from "./groups";
import { stageLabel } from "./matchday";
import { isBayArea, stadiumImagery } from "./stadium-imagery";

export type MatchCardData = {
  matchId: string;
  group: string | null;       // "GROUP A" / "ROUND OF 16" / etc.
  homeCode: string;
  awayCode: string;
  kickoffUtc: string;         // ISO — used for sorting + countdown
  dateLabel: string;          // "Thu, Jun 11"
  timeLabel: string;          // "5:00 PM PT"
  stadium: string;
  city: string;
  isBayArea: boolean;
  backgroundUrl: string;
};

const PT_DATE: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "America/Los_Angeles",
};

const PT_TIME: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Los_Angeles",
};

function formatPTDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", PT_DATE);
}

function formatPTTime(iso: string): string {
  return `${new Date(iso).toLocaleTimeString("en-US", PT_TIME)} PT`;
}

export function fixtureToMatchData(f: Fixture): MatchCardData {
  // The seeded fixtures only carry `played_in_bay_area` + a generic
  // `host_city: san-francisco` label. Treat bay-area=true as SF Bay Area
  // and everything else as a generic host. Once fixture data carries real
  // host-city values, this branch picks them up automatically.
  const cityKey = f.played_in_bay_area ? "san francisco bay area" : f.host_city;
  const imagery = stadiumImagery(cityKey);

  return {
    matchId: f.match_id,
    group: stageLabel(f.stage).toUpperCase(),
    homeCode: f.home_team,
    awayCode: f.away_team,
    kickoffUtc: f.kickoff_utc,
    dateLabel: formatPTDate(f.kickoff_local),
    timeLabel: formatPTTime(f.kickoff_local),
    stadium: f.played_in_bay_area ? "Levi's Stadium" : imagery.stadium,
    city: f.played_in_bay_area ? "San Francisco Bay Area" : imagery.city,
    isBayArea: f.played_in_bay_area || isBayArea(f.host_city),
    backgroundUrl: imagery.imageUrl,
  };
}

export type MatchFilter = {
  team?: string | null;       // 3-letter FIFA code; matches home OR away
  group?: string | null;      // "A" .. "L"
  bayAreaOnly?: boolean;
};

export function filterMatches(
  matches: MatchCardData[],
  filter: MatchFilter,
): MatchCardData[] {
  const team = filter.team?.toUpperCase() ?? null;
  const group = filter.group?.toUpperCase() ?? null;

  return matches.filter((m) => {
    if (team && m.homeCode !== team && m.awayCode !== team) return false;
    if (group && m.group !== `GROUP ${group}`) return false;
    if (filter.bayAreaOnly && !m.isBayArea) return false;
    return true;
  });
}

// Distinct teams across a list — used to populate the filter dropdown.
export function teamsFromMatches(matches: MatchCardData[]): string[] {
  const set = new Set<string>();
  for (const m of matches) {
    set.add(m.homeCode);
    set.add(m.awayCode);
  }
  return Array.from(set).sort();
}

// `groupFromStage` is re-exported for callers that already have a fixture.
export { groupFromStage };

// ---------------------------------------------------------------------------
// STARTER_MATCHES — small constant array kept in sync with the user's
// requested example data. Used when the live Supabase fixtures list is
// empty (dev/CI), and as documentation of the canonical card shape.

const starter = (
  matchId: string,
  group: string,
  home: string,
  away: string,
  isoUtc: string,
  cityKey: string,
): MatchCardData => {
  const imagery = stadiumImagery(cityKey);
  return {
    matchId,
    group,
    homeCode: home,
    awayCode: away,
    kickoffUtc: isoUtc,
    dateLabel: formatPTDate(isoUtc),
    timeLabel: formatPTTime(isoUtc),
    stadium: imagery.stadium,
    city: imagery.city,
    isBayArea: isBayArea(cityKey),
    backgroundUrl: imagery.imageUrl,
  };
};

export const STARTER_MATCHES: MatchCardData[] = [
  // June 11, 2026 — opener at Estadio Azteca, ~12:00 local CDMX → 10:00 PT.
  starter("SM-1", "GROUP A", "MEX", "RSA", "2026-06-11T18:00:00Z", "mexico city"),
  // June 12, 2026 — USA opens at SoFi.
  starter("SM-2", "GROUP D", "USA", "PAR", "2026-06-12T22:00:00Z", "los angeles"),
  // June 13, 2026 — SF Bay Area group match.
  starter("SM-3", "GROUP F", "QAT", "SUI", "2026-06-13T20:00:00Z", "san francisco"),
  // June 14, 2026 — Houston.
  starter("SM-4", "GROUP E", "GER", "CUW", "2026-06-14T19:00:00Z", "houston"),
];
