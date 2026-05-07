import type { Fixture, Venue, VenueAtmosphere, VenueMatchRules } from "./types";

export type VenueWithRelations = Venue & {
  atmosphere: VenueAtmosphere | null;
  match_rules: VenueMatchRules | null;
};

export type CrowdConfidence = "open" | "room" | "filling_up" | "packed" | "full";

export type RankedVenue = {
  venue: VenueWithRelations;
  rank: number;
  reason: string;
  crowd: CrowdConfidence;
  distanceMi: number | null;
};

const TARGET_TEAMS = new Set([
  "USA",
  "MEX",
  "ARG",
  "BRA",
  "ENG",
  "GER",
  "FRA",
  "NED",
  "ESP",
  "POR",
]);

// A venue qualifies for a given fixture when its match_filter matches the fixture stage/teams.
// Returns a ranking reason string, or null if it doesn't qualify.
export function venueQualifiesForFixture(
  venue: VenueWithRelations,
  fixture: Fixture,
): string | null {
  const filter = venue.match_rules?.match_filter;

  // A venue with no specific filter falls back to `all`.
  const effective = filter ?? "all";

  if (effective === "all") return "Showing every match on the schedule.";

  if (effective === "USA-matches") {
    if (fixture.home_team === "USA" || fixture.away_team === "USA") {
      return "Official USA watch party.";
    }
    return null;
  }

  if (effective === "group-stage") {
    if (fixture.stage.startsWith("group-")) return "Running through the group stage.";
    return null;
  }

  if (effective === "knockout-only") {
    if (!fixture.stage.startsWith("group-")) return "Knockout-round venue.";
    return null;
  }

  // TBD or unknown filter — treat as likely-showing but flag uncertainty.
  if (venue.likely_showing) return "Likely showing — schedule TBD.";
  return null;
}

// Sort order: primary > secondary > fallback, then by name.
const RELEVANCE_RANK: Record<Venue["relevance_level"], number> = {
  primary: 0,
  secondary: 1,
  fallback: 2,
};

export function rankVenuesForFixture(
  venues: VenueWithRelations[],
  fixture: Fixture,
): RankedVenue[] {
  const qualified: RankedVenue[] = [];

  for (const v of venues) {
    if (!v.active) continue;
    const reason = venueQualifiesForFixture(v, fixture);
    if (!reason) continue;

    qualified.push({
      venue: v,
      rank: 0, // assigned below
      reason,
      crowd: deriveCrowdConfidence(v, fixture),
      distanceMi: null,
    });
  }

  qualified.sort((a, b) => {
    const ra = RELEVANCE_RANK[a.venue.relevance_level];
    const rb = RELEVANCE_RANK[b.venue.relevance_level];
    if (ra !== rb) return ra - rb;
    return a.venue.name.localeCompare(b.venue.name);
  });

  qualified.forEach((r, i) => (r.rank = i + 1));
  return qualified;
}

// Rule-based crowd confidence for MVP.
// Real-time user reports aren't wired yet, so we derive a pre-match expectation from
// venue relevance, the fixture's target-team weight, and time until kickoff.
export function deriveCrowdConfidence(
  venue: VenueWithRelations,
  fixture: Fixture,
  now: Date = new Date(),
): CrowdConfidence {
  const kickoff = new Date(fixture.kickoff_utc).getTime();
  const hoursUntilKickoff = (kickoff - now.getTime()) / (1000 * 60 * 60);

  const teamWeight =
    TARGET_TEAMS.has(fixture.home_team) || TARGET_TEAMS.has(fixture.away_team) ? 1 : 0;
  const levisBonus = fixture.played_in_bay_area ? 1 : 0;

  let base = 0;
  if (venue.relevance_level === "primary") base = 2;
  else if (venue.relevance_level === "secondary") base = 1;
  else base = 0;

  const intensity = base + teamWeight + levisBonus;

  // Time-based ramp: well before kickoff things are quiet; within 2 hours they fill.
  if (hoursUntilKickoff > 72) return intensity >= 3 ? "room" : "open";
  if (hoursUntilKickoff > 6) {
    if (intensity >= 4) return "filling_up";
    if (intensity >= 2) return "room";
    return "open";
  }
  if (hoursUntilKickoff > 1) {
    if (intensity >= 4) return "packed";
    if (intensity >= 2) return "filling_up";
    return "room";
  }
  // Inside the final hour / during the match.
  if (intensity >= 4) return "full";
  if (intensity >= 2) return "packed";
  return "filling_up";
}

export function crowdLabel(c: CrowdConfidence): string {
  switch (c) {
    case "open":
      return "Plenty of room";
    case "room":
      return "Room available";
    case "filling_up":
      return "Filling up";
    case "packed":
      return "Packed";
    case "full":
      return "Full";
  }
}

export function crowdDotClass(c: CrowdConfidence): string {
  switch (c) {
    case "open":
    case "room":
      return "bg-official";
    case "filling_up":
      return "bg-amber";
    case "packed":
    case "full":
      return "bg-full-red";
  }
}

// Haversine distance in miles between two lat/lng pairs.
export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3958.8; // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Given a primary venue, find the nearest 1-2 alternative venues that still qualify
// for this fixture. Falls back to any active venue within 1.5mi if none qualify.
export function computeFallbacks(
  primary: VenueWithRelations,
  allVenues: VenueWithRelations[],
  fixture: Fixture,
  maxCount = 2,
  maxMiles = 1.5,
): RankedVenue[] {
  const candidates: RankedVenue[] = [];

  for (const v of allVenues) {
    if (v.id === primary.id) continue;
    if (!v.active) continue;
    const distanceMi = haversineMiles(primary.lat, primary.lng, v.lat, v.lng);
    if (distanceMi > maxMiles) continue;

    const reason = venueQualifiesForFixture(v, fixture) ?? "Nearby fallback.";
    candidates.push({
      venue: v,
      rank: 0,
      reason,
      crowd: deriveCrowdConfidence(v, fixture),
      distanceMi,
    });
  }

  candidates.sort((a, b) => (a.distanceMi ?? 0) - (b.distanceMi ?? 0));
  return candidates.slice(0, maxCount).map((c, i) => ({ ...c, rank: i + 1 }));
}

// Fixture formatters -------------------------------------------------------

export function fixtureLabel(f: Fixture): string {
  return `${f.home_team} v ${f.away_team}`;
}

export function stageLabel(stage: string): string {
  const map: Record<string, string> = {
    r32: "Round of 32",
    r16: "Round of 16",
    qf: "Quarterfinal",
    sf: "Semifinal",
    "third-place": "Third-place match",
    final: "Final",
  };
  if (map[stage]) return map[stage];
  if (stage.startsWith("group-")) return `Group ${stage.slice(-1).toUpperCase()}`;
  return stage;
}

export function matchCode(f: Fixture): string {
  return `${f.match_id} · ${stageLabel(f.stage).toUpperCase()}`;
}

export function formatKickoffLocal(f: Fixture): string {
  const d = new Date(f.kickoff_local);
  const datePart = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
  return `${datePart} · ${timePart} PT`;
}

export function kickoffCountdown(f: Fixture, now: Date = new Date()): string {
  const ms = new Date(f.kickoff_utc).getTime() - now.getTime();
  if (ms <= 0) return "Kicked off";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}
