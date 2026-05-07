// Crowd-data fetcher selector.
//
// Reads the OUTSCRAPER_ENABLED flag at call time so a single env flip is enough
// to swap providers without redeploy. Both providers conform to CrowdFetchResult.

import { fetchOutscraperCrowd } from "./outscraper";
import { fetchSerpapiCrowd, type CrowdFetchResult } from "./serpapi";

export type CrowdProvider = "serpapi" | "outscraper";

export function activeProvider(): CrowdProvider {
  return process.env.OUTSCRAPER_ENABLED === "true" ? "outscraper" : "serpapi";
}

export async function fetchCrowd(
  placeId: string,
): Promise<{ data: CrowdFetchResult | null; provider: CrowdProvider }> {
  const provider = activeProvider();
  const data =
    provider === "outscraper"
      ? await fetchOutscraperCrowd(placeId)
      : await fetchSerpapiCrowd(placeId);
  return { data, provider };
}

export type { CrowdFetchResult };
