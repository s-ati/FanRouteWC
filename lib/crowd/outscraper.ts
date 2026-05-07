// Outscraper fetcher — config-flagged fallback for SerpAPI.
//
// Wired but inactive. Flips on when OUTSCRAPER_ENABLED=true is set in env
// (e.g. SerpAPI quota exhausted, parser broken mid-tournament). Same return
// shape as fetchSerpapiCrowd, so the selector in fetcher.ts can swap without
// touching the calculator.

import type { CrowdFetchResult } from "./serpapi";

const OUTSCRAPER_BASE = "https://api.outscraper.com/maps/popular-times-v2";

export function extractCrowdFromOutscraper(
  json: unknown,
): CrowdFetchResult | null {
  if (!json || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown> | unknown[] | undefined;

  const first = Array.isArray(data) ? (data[0] as Record<string, unknown>) : data;
  if (!first || typeof first !== "object") return null;

  const popular = (first as Record<string, unknown>).popular_times as
    | Array<Array<{ percentage?: number }>>
    | undefined;
  const live = (first as Record<string, unknown>).live_popular_times as
    | { percentage?: number }
    | undefined;

  if (!popular || !Array.isArray(popular)) return null;

  const week: number[][] = Array.from({ length: 7 }, () =>
    new Array<number>(24).fill(0),
  );
  for (let d = 0; d < 7 && d < popular.length; d++) {
    const day = popular[d];
    if (!Array.isArray(day)) continue;
    for (let h = 0; h < 24 && h < day.length; h++) {
      const cell = day[h];
      const pct = typeof cell?.percentage === "number" ? cell.percentage : 0;
      week[d][h] = Math.max(0, Math.min(100, Math.round(pct)));
    }
  }

  const live_pct =
    typeof live?.percentage === "number"
      ? Math.max(0, Math.min(100, Math.round(live.percentage)))
      : null;

  return { live_pct, weekly_forecast: week, polled_at: new Date() };
}

export async function fetchOutscraperCrowd(
  placeId: string,
): Promise<CrowdFetchResult | null> {
  const apiKey = process.env.OUTSCRAPER_API_KEY;
  if (!apiKey) {
    console.error("[outscraper] OUTSCRAPER_API_KEY not set");
    return null;
  }

  const url = `${OUTSCRAPER_BASE}?query=${encodeURIComponent(placeId)}&async=false`;
  try {
    const resp = await fetch(url, {
      headers: { "X-API-KEY": apiKey },
      cache: "no-store",
    });
    if (!resp.ok) {
      console.error(
        `[outscraper] HTTP ${resp.status} for place_id=${placeId}`,
      );
      return null;
    }
    const json = (await resp.json()) as unknown;
    return extractCrowdFromOutscraper(json);
  } catch (err) {
    console.error(`[outscraper] fetch failed for place_id=${placeId}:`, err);
    return null;
  }
}
