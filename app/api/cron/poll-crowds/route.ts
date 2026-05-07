// Per-match-trigger crowd poll.
//
// Runs every 5 min (vercel.json). Authenticates via Bearer ${CRON_SECRET}.
//
// Triggers:
//   T-60: any fixture kicking off in [now+55, now+65]
//   T-15: marquee fixtures (USA games + R16/QF/SF/Final) in [now+10, now+20]
//
// For each trigger, polls venues whose country_affiliations overlaps with the
// playing teams (or contains '*' for neutral hotspots). 60-min cache dedupes
// repeat polls if the same venue is in scope for two adjacent matches.
//
// SerpAPI free tier is 250 calls/month — every poll counts. We never retry on
// null popular_times, never poll outside the trigger windows, and skip the
// SerpAPI call entirely when a fresh row already exists.

import { NextResponse } from "next/server";
import { fetchCrowd } from "@/lib/crowd/fetcher";
import { bucketFromBusyness } from "@/lib/crowd/calculate";
import { createAdminClient } from "@/lib/supabase/server";
import type { CrowdSource, Fixture, Venue } from "@/lib/types";

const T60_MIN_OFFSET = 55;
const T60_MAX_OFFSET = 65;
const T15_MIN_OFFSET = 10;
const T15_MAX_OFFSET = 20;
const CACHE_TTL_MIN = 60;
const ROW_TTL_MIN = 60;

const MARQUEE_STAGES = new Set([
  "round-of-16",
  "quarterfinal",
  "semifinal",
  "final",
]);

type PollOutcome =
  | { venue_id: string; status: "polled"; live_pct: number | null }
  | { venue_id: string; status: "cached" }
  | { venue_id: string; status: "no_place_id" }
  | { venue_id: string; status: "fetch_failed" };

function isMarquee(fixture: Fixture): boolean {
  if (MARQUEE_STAGES.has(fixture.stage)) return true;
  return fixture.home_team === "USA" || fixture.away_team === "USA";
}

async function pollVenueForFixture(
  db: ReturnType<typeof createAdminClient>,
  venue: Pick<Venue, "id" | "place_id">,
  fixture: Fixture,
  now: Date,
): Promise<PollOutcome> {
  if (!venue.place_id) {
    return { venue_id: venue.id, status: "no_place_id" };
  }

  // Cache check — skip if a row of any external source landed within TTL.
  const cacheCutoff = new Date(now.getTime() - CACHE_TTL_MIN * 60_000);
  const { data: cached } = await db
    .from("crowd_status")
    .select("id, polled_at, source")
    .eq("venue_id", venue.id)
    .in("source", ["serpapi_live", "outscraper_live"])
    .gte("polled_at", cacheCutoff.toISOString())
    .order("polled_at", { ascending: false })
    .limit(1);

  if (cached && cached.length > 0) {
    return { venue_id: venue.id, status: "cached" };
  }

  const { data: crowd, provider } = await fetchCrowd(venue.place_id);
  if (!crowd) {
    return { venue_id: venue.id, status: "fetch_failed" };
  }

  // Null live_pct (low-traffic venue) is still a successful response — record
  // it so we don't keep retrying. The calculator will fall through to forecast.
  const pct = crowd.live_pct;
  const source: CrowdSource =
    provider === "outscraper" ? "outscraper_live" : "serpapi_live";

  const expires_at = new Date(now.getTime() + ROW_TTL_MIN * 60_000).toISOString();
  const confidence = pct == null ? "open" : bucketFromBusyness(pct);

  const { error } = await db.from("crowd_status").insert({
    venue_id: venue.id,
    match_id: fixture.match_id,
    raw_busyness_pct: pct,
    confidence,
    source,
    polled_at: now.toISOString(),
    expires_at,
  });
  if (error) {
    console.error(`[cron.poll-crowds] insert failed for ${venue.id}`, error);
    return { venue_id: venue.id, status: "fetch_failed" };
  }

  return { venue_id: venue.id, status: "polled", live_pct: pct };
}

async function fixturesInWindow(
  db: ReturnType<typeof createAdminClient>,
  now: Date,
  minOffset: number,
  maxOffset: number,
): Promise<Fixture[]> {
  const min = new Date(now.getTime() + minOffset * 60_000).toISOString();
  const max = new Date(now.getTime() + maxOffset * 60_000).toISOString();
  const { data, error } = await db
    .from("fixtures")
    .select("*")
    .gte("kickoff_utc", min)
    .lte("kickoff_utc", max);
  if (error) throw error;
  return (data ?? []) as Fixture[];
}

async function venuesForFixture(
  db: ReturnType<typeof createAdminClient>,
  fixture: Fixture,
): Promise<Pick<Venue, "id" | "place_id">[]> {
  const teams = [fixture.home_team, fixture.away_team, "*"];
  const { data, error } = await db
    .from("venues")
    .select("id, place_id")
    .eq("active", true)
    .overlaps("country_affiliations", teams);
  if (error) throw error;
  return (data ?? []) as Pick<Venue, "id" | "place_id">[];
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const db = createAdminClient();

  const t60 = await fixturesInWindow(db, now, T60_MIN_OFFSET, T60_MAX_OFFSET);
  const t15All = await fixturesInWindow(db, now, T15_MIN_OFFSET, T15_MAX_OFFSET);
  const t15 = t15All.filter(isMarquee);

  const triggers: Array<{ trigger: "T-60" | "T-15"; fixture: Fixture }> = [
    ...t60.map((f) => ({ trigger: "T-60" as const, fixture: f })),
    ...t15.map((f) => ({ trigger: "T-15" as const, fixture: f })),
  ];

  const outcomes: Array<{
    trigger: string;
    match_id: string;
    venue_id: string;
    status: string;
    live_pct?: number | null;
  }> = [];

  for (const { trigger, fixture } of triggers) {
    const venues = await venuesForFixture(db, fixture);
    for (const venue of venues) {
      const outcome = await pollVenueForFixture(db, venue, fixture, now);
      outcomes.push({
        trigger,
        match_id: fixture.match_id,
        venue_id: outcome.venue_id,
        status: outcome.status,
        ...(outcome.status === "polled" ? { live_pct: outcome.live_pct } : {}),
      });
    }
  }

  return NextResponse.json({
    ran_at: now.toISOString(),
    triggers: { t60: t60.length, t15: t15.length },
    outcomes,
  });
}
