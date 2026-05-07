// Server-side derivation of the bar-card occupancy chip + short note.
//
// No new tables: composes inputs we already have.
//   - country.fan_demand_tier        → demand of the team playing
//   - bar_country_affinity.role      → 'home_bar' = official supporters bar
//   - fixture.kickoff_utc            → minutes-to-kickoff
//   - latest crowd_status row        → live truth, if available
//
// Returns a 3-color bucket + a short consumer-facing note.

import type { CrowdConfidence } from "../matchday";
import type { FanDemandTier, AffinityRole } from "../types";
import { colorFromConfidence, type OccupancyColor } from "@/components/OccupancyBadge";

export type OccupancyVerdict = {
  color: OccupancyColor;
  label: string; // 1–2 words, sits inside the badge
  note: string;  // short sentence under/beside the badge
};

const PLENTY: OccupancyVerdict = {
  color: "green",
  label: "Open",
  note: "Plenty of room — easy to walk in.",
};

const COMFORTABLE: OccupancyVerdict = {
  color: "green",
  label: "Comfortable",
  note: "Some seats taken but you'll get one.",
};

const FILLING: OccupancyVerdict = {
  color: "orange",
  label: "Filling up",
  note: "Filling up fast — head over soon.",
};

const TIGHT: OccupancyVerdict = {
  color: "red",
  label: "Tight",
  note: "Tight squeeze — line at the door likely.",
};

const FULL: OccupancyVerdict = {
  color: "red",
  label: "Full",
  note: "At capacity right now.",
};

// Translate an internal CrowdConfidence into the 3-color verdict.
// Used when we have a real crowd_status reading.
export function verdictFromConfidence(c: CrowdConfidence): OccupancyVerdict {
  switch (c) {
    case "open":
      return PLENTY;
    case "room":
      return COMFORTABLE;
    case "filling_up":
      return FILLING;
    case "packed":
      return TIGHT;
    case "full":
      return FULL;
  }
}

type ForecastInput = {
  demandTier: FanDemandTier | null;     // country.fan_demand_tier of the team playing
  affinityRole: AffinityRole | null;    // 'home_bar' = official supporter bar for this team
  minutesToKickoff: number | null;      // null when no upcoming match
  liveConfidence: CrowdConfidence | null; // latest crowd_status, if any
};

// Compose a verdict. Live data wins; otherwise we forecast from demand × role × time.
export function occupancyVerdict(input: ForecastInput): OccupancyVerdict {
  // 1. Live truth, if recent.
  if (input.liveConfidence) {
    return verdictFromConfidence(input.liveConfidence);
  }

  const isOfficial = input.affinityRole === "home_bar";
  const isHotTeam =
    input.demandTier === "very_high" || input.demandTier === "high";
  const mins = input.minutesToKickoff;

  // 2. Forecast — official bars + hot teams build pressure earliest.
  if (isOfficial && isHotTeam && mins !== null && mins < 90) {
    return { color: "red", label: "Pre-game", note: "Fans are already lining up." };
  }
  if (isOfficial && mins !== null && mins < 180) {
    return FILLING;
  }
  if (isHotTeam && mins !== null && mins < 60) {
    return {
      color: "orange",
      label: "Filling up",
      note: "Expect a crowd at kickoff.",
    };
  }
  if (mins !== null && mins < 30) {
    return COMFORTABLE;
  }
  return PLENTY;
}

// Convenience for callers that already have a CrowdResult-like shape.
export { colorFromConfidence };
