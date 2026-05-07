// SerpAPI Google Maps fetcher — primary crowd data source.
//
// Calls https://serpapi.com/search.json with engine=google_maps&place_id=...
// Returns popular_times weekly histogram + current live busyness when available.
//
// Defensive: many low-traffic venues return null popular_times. We accept that
// silently and let the calculator fall back to forecast/rules. We never throw —
// any error returns null so the app continues rendering.

const SERPAPI_BASE = "https://serpapi.com/search.json";

export type CrowdFetchResult = {
  live_pct: number | null;
  weekly_forecast: number[][]; // [day 0..6][hour 0..23] busyness 0..100
  polled_at: Date;
};

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function emptyWeek(): number[][] {
  return Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
}

// Extract crowd data from a SerpAPI google_maps response.
// Exported so tests / calibration scripts can feed in saved sample JSON.
export function extractCrowdFromSerpapi(json: unknown): CrowdFetchResult | null {
  if (!json || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;

  // SerpAPI nests the venue payload under place_results.
  const place = (root.place_results ?? root.place_result ?? root) as
    | Record<string, unknown>
    | undefined;
  if (!place) return null;

  const popular = place.popular_times as Record<string, unknown> | undefined;
  if (!popular) return null;

  const graph = (popular.graph_results ?? popular.weekly ?? popular) as
    | Record<string, unknown>
    | undefined;
  if (!graph) return null;

  const week = emptyWeek();
  let liveFromCurrent: number | null = null;

  for (let d = 0; d < 7; d++) {
    const dayKey = DAY_KEYS[d];
    const dayEntries = graph[dayKey] as unknown;
    if (!Array.isArray(dayEntries)) continue;

    for (const entry of dayEntries) {
      if (!entry || typeof entry !== "object") continue;
      const e = entry as Record<string, unknown>;

      const hour = parseHour(e.time);
      const score = numericBusyness(e.busyness_score);
      if (hour === null || score === null) continue;

      week[d][hour] = score;
      if (e.current === true) liveFromCurrent = score;
    }
  }

  // Top-level live score takes priority when SerpAPI provides it explicitly.
  const liveTopLevel = numericBusyness(
    place.live_busyness_score ?? popular.live_busyness_score,
  );

  return {
    live_pct: liveTopLevel ?? liveFromCurrent,
    weekly_forecast: week,
    polled_at: new Date(),
  };
}

function parseHour(time: unknown): number | null {
  if (typeof time === "number" && time >= 0 && time <= 23) return time;
  if (typeof time !== "string") return null;
  // "6 AM", "12 PM", "11 PM" → 6, 12, 23
  const m = time.trim().match(/^(\d{1,2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  if (Number.isNaN(h)) return null;
  const meridiem = m[2].toUpperCase();
  if (meridiem === "AM") h = h === 12 ? 0 : h;
  else h = h === 12 ? 12 : h + 12;
  return h >= 0 && h <= 23 ? h : null;
}

function numericBusyness(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export async function fetchSerpapiCrowd(
  placeId: string,
): Promise<CrowdFetchResult | null> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.error("[serpapi] SERPAPI_API_KEY not set");
    return null;
  }

  const url = `${SERPAPI_BASE}?engine=google_maps&place_id=${encodeURIComponent(placeId)}&api_key=${encodeURIComponent(apiKey)}`;

  try {
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) {
      console.error(
        `[serpapi] HTTP ${resp.status} for place_id=${placeId}`,
      );
      return null;
    }
    const json = (await resp.json()) as unknown;
    return extractCrowdFromSerpapi(json);
  } catch (err) {
    console.error(`[serpapi] fetch failed for place_id=${placeId}:`, err);
    return null;
  }
}
