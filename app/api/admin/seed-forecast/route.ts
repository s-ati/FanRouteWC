// Forecast seed — manually triggered by ops, not on a cron.
//
// POST with `Authorization: Bearer ${CRON_SECRET}` to pull weekly forecast
// for every active venue with a place_id. One SerpAPI call per venue → one
// crowd_status row per venue with source=serpapi_forecast and a 30-day TTL.
//
// Run on:
//   - May 28 (testing — comes out of May's 250-call budget)
//   - June 1  (warm up June cycle)
//   - June 11 (tournament-start refresh — Google updates monthly)

import { NextResponse } from "next/server";
import { fetchCrowd } from "@/lib/crowd/fetcher";
import { bucketFromBusyness } from "@/lib/crowd/calculate";
import { createAdminClient } from "@/lib/supabase/server";
import type { CrowdSource } from "@/lib/types";

const FORECAST_TTL_DAYS = 30;

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const expires_at = new Date(
    now.getTime() + FORECAST_TTL_DAYS * 24 * 60 * 60_000,
  ).toISOString();

  const db = createAdminClient();
  const { data: venues, error } = await db
    .from("venues")
    .select("id, place_id")
    .eq("active", true)
    .not("place_id", "is", null);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const outcomes: Array<{ venue_id: string; status: string }> = [];

  for (const venue of venues ?? []) {
    if (!venue.place_id) continue;

    const { data: crowd, provider } = await fetchCrowd(venue.place_id);
    if (!crowd) {
      outcomes.push({ venue_id: venue.id, status: "fetch_failed" });
      continue;
    }

    // The forecast we store is a single representative day-average for now.
    // The 7×24 grid is in crowd.weekly_forecast — we collapse to a peak avg
    // for V1 so the calculator can render something useful immediately.
    // Calibration during May will tell us if this collapse needs to become
    // a per-day-of-week lookup.
    const peakAvg = peakAverage(crowd.weekly_forecast);
    const source: CrowdSource =
      provider === "outscraper" ? "outscraper_forecast" : "serpapi_forecast";

    const { error: insertErr } = await db.from("crowd_status").insert({
      venue_id: venue.id,
      match_id: null,
      raw_busyness_pct: peakAvg,
      confidence: bucketFromBusyness(peakAvg),
      source,
      polled_at: now.toISOString(),
      expires_at,
    });

    if (insertErr) {
      console.error(
        `[seed-forecast] insert failed for ${venue.id}`,
        insertErr,
      );
      outcomes.push({ venue_id: venue.id, status: "insert_failed" });
    } else {
      outcomes.push({ venue_id: venue.id, status: "seeded" });
    }
  }

  return NextResponse.json({
    ran_at: now.toISOString(),
    seeded: outcomes.filter((o) => o.status === "seeded").length,
    total: outcomes.length,
    outcomes,
  });
}

// Peak hours = 17:00–22:00 (5pm–10pm) — the gameday viewing window for most
// matches in SF local time. Average across days, only counting peak hours.
function peakAverage(weeklyGrid: number[][]): number {
  let sum = 0;
  let count = 0;
  for (const day of weeklyGrid) {
    for (let h = 17; h <= 22; h++) {
      const v = day[h];
      if (typeof v === "number") {
        sum += v;
        count++;
      }
    }
  }
  return count > 0 ? Math.round(sum / count) : 0;
}
