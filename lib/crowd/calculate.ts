// Crowd confidence calculator — single entry point for the venue card UI.
//
// Priority chain (first hit wins):
//   1. admin_override   — any age
//   2. user_report      — ≤30 min old
//   3. serpapi_live     — ≤90 min old (UI dims older data via decay states)
//      outscraper_live  — same window
//   4. serpapi_forecast — matched to fixture's day-of-week + hour-of-day
//      outscraper_forecast — same
//   5. rule-based       — existing deriveCrowdConfidence in lib/matchday.ts
//
// Returns { crowd, source, polledAt, ageMin } so the UI can render a timestamp,
// a source label, and the visual confidence-decay state.

import { getRecentCrowdStatus } from "../queries";
import {
  deriveCrowdConfidence,
  type CrowdConfidence,
  type RankedVenue,
} from "../matchday";
import type { VenueWithRelations } from "../matchday";
import type { CrowdSource, CrowdStatusRow, Fixture } from "../types";

export type CalcSource = CrowdSource | "rule_fallback";

export type CrowdResult = {
  crowd: CrowdConfidence;
  source: CalcSource;
  polledAt: Date | null;
  ageMin: number | null;
  raw_pct: number | null;
};

const USER_REPORT_TTL_MIN = 30;
const LIVE_TTL_MIN = 90;

// Initial busyness % → CrowdConfidence thresholds.
// Calibrate during May testing using ~50 spot-check calls; replace these defaults
// once we have ground-truth observations to compare against.
export function bucketFromBusyness(pct: number): CrowdConfidence {
  if (pct < 30) return "open";
  if (pct < 55) return "room";
  if (pct < 75) return "filling_up";
  if (pct < 90) return "packed";
  return "full";
}

function ageMinutes(polledAt: string, now: Date): number {
  const ageMs = now.getTime() - new Date(polledAt).getTime();
  return Math.max(0, Math.round(ageMs / 60000));
}

// Read the forecast entry for the fixture's day/hour. Forecast rows store the
// 7×24 weekly grid — day 0 = Sunday, hour 0–23 in venue local time.
function forecastBucketFor(
  row: CrowdStatusRow,
  fixture: Fixture,
): { bucket: CrowdConfidence; pct: number } | null {
  // For now we read the row's own confidence/raw_pct (set when forecast was
  // seeded for the matching day/hour). A future iteration can store the full
  // 7×24 grid in a separate column and look up by fixture time. Until then,
  // any forecast row stands in as the day-of-week baseline.
  if (row.raw_busyness_pct == null) return null;
  void fixture;
  return {
    bucket: bucketFromBusyness(row.raw_busyness_pct),
    pct: row.raw_busyness_pct,
  };
}

export async function calculateCrowdConfidence(
  venue: VenueWithRelations,
  fixture: Fixture,
  now: Date = new Date(),
): Promise<CrowdResult> {
  let rows: CrowdStatusRow[] = [];
  try {
    rows = await getRecentCrowdStatus(venue.id, 10);
  } catch (err) {
    console.error("[crowd.calculate] read failed", err);
    rows = [];
  }

  // 1. admin_override — any age wins
  const override = rows.find((r) => r.source === "admin_override");
  if (override) {
    return {
      crowd: override.confidence,
      source: "admin_override",
      polledAt: new Date(override.polled_at),
      ageMin: ageMinutes(override.polled_at, now),
      raw_pct: override.raw_busyness_pct,
    };
  }

  // 2. user_report ≤30 min
  const recentUser = rows.find(
    (r) =>
      r.source === "user_report" &&
      ageMinutes(r.polled_at, now) <= USER_REPORT_TTL_MIN,
  );
  if (recentUser) {
    return {
      crowd: recentUser.confidence,
      source: "user_report",
      polledAt: new Date(recentUser.polled_at),
      ageMin: ageMinutes(recentUser.polled_at, now),
      raw_pct: recentUser.raw_busyness_pct,
    };
  }

  // 3. live external ≤90 min
  const recentLive = rows.find(
    (r) =>
      (r.source === "serpapi_live" || r.source === "outscraper_live") &&
      ageMinutes(r.polled_at, now) <= LIVE_TTL_MIN &&
      r.raw_busyness_pct != null,
  );
  if (recentLive && recentLive.raw_busyness_pct != null) {
    return {
      crowd: bucketFromBusyness(recentLive.raw_busyness_pct),
      source: recentLive.source,
      polledAt: new Date(recentLive.polled_at),
      ageMin: ageMinutes(recentLive.polled_at, now),
      raw_pct: recentLive.raw_busyness_pct,
    };
  }

  // 4. forecast (any age within row.expires_at, which the seeder controls)
  const forecast = rows.find(
    (r) =>
      r.source === "serpapi_forecast" || r.source === "outscraper_forecast",
  );
  if (forecast) {
    const f = forecastBucketFor(forecast, fixture);
    if (f) {
      return {
        crowd: f.bucket,
        source: forecast.source,
        polledAt: new Date(forecast.polled_at),
        ageMin: ageMinutes(forecast.polled_at, now),
        raw_pct: f.pct,
      };
    }
  }

  // 5. rule-based fallback (existing logic)
  return {
    crowd: deriveCrowdConfidence(venue, fixture, now),
    source: "rule_fallback",
    polledAt: null,
    ageMin: null,
    raw_pct: null,
  };
}

export type EnrichedRankedVenue = RankedVenue & {
  crowdSource: CalcSource;
  crowdPolledAt: Date | null;
  crowdAgeMin: number | null;
  crowdRawPct: number | null;
};

// Replace the rule-based RankedVenue.crowd with calculator output, and attach
// source + age metadata so the UI can render timestamp + decay state.
// Keeps rankVenuesForFixture synchronous; this is the async second pass.
export async function enrichRankedWithRealCrowd(
  ranked: RankedVenue[],
  fixture: Fixture,
  now: Date = new Date(),
): Promise<EnrichedRankedVenue[]> {
  return Promise.all(
    ranked.map(async (r) => {
      const result = await calculateCrowdConfidence(r.venue, fixture, now);
      return {
        ...r,
        crowd: result.crowd,
        crowdSource: result.source,
        crowdPolledAt: result.polledAt,
        crowdAgeMin: result.ageMin,
        crowdRawPct: result.raw_pct,
      };
    }),
  );
}
