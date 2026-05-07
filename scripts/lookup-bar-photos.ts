// One-shot: take a JSON list of {id, name, address} bars and fetch a
// representative photo URL from SerpAPI's google_maps engine.
//
// Run: tsx scripts/lookup-bar-photos.ts < /tmp/bars-for-photos.json
//      tsx scripts/lookup-bar-photos.ts /tmp/bars-for-photos.json
//
// Cost: 1 SerpAPI credit per bar. Photos point to Google's CDN
// (lh*.googleusercontent.com); they're stable enough for MVP but
// Google may rotate them — re-run periodically.

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    let value = t.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

type BarInput = { id: string; name: string; address: string };
type LookupResult = {
  id: string;
  name: string;
  address: string;
  photo_url?: string;
  photo_attribution?: string;
  resolved_title?: string;
  error?: string;
};

function pickPhoto(top: Record<string, unknown>): {
  url?: string;
  attribution?: string;
} {
  const thumbnail = top.thumbnail;
  const photos = top.photos as Array<Record<string, unknown>> | undefined;
  const firstPhoto = Array.isArray(photos) && photos.length > 0 ? photos[0] : undefined;

  const url =
    (firstPhoto?.image as string | undefined) ??
    (firstPhoto?.thumbnail as string | undefined) ??
    (typeof thumbnail === "string" ? thumbnail : undefined);

  const attribution =
    (firstPhoto?.user as { name?: string } | undefined)?.name ??
    (firstPhoto?.attribution as string | undefined);

  return { url, attribution };
}

async function lookupOne(
  bar: BarInput,
  apiKey: string,
): Promise<LookupResult> {
  const q = `${bar.name} ${bar.address}`;
  const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(
    q,
  )}&api_key=${encodeURIComponent(apiKey)}`;

  try {
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) {
      return { ...bar, error: `HTTP ${resp.status}` };
    }
    const json = (await resp.json()) as Record<string, unknown>;

    const place = json.place_results as Record<string, unknown> | undefined;
    const local = (json.local_results as Array<Record<string, unknown>> | undefined) ?? [];
    const top = place ?? local[0];

    if (!top) {
      return { ...bar, error: "no result" };
    }

    const { url: photo_url, attribution: photo_attribution } = pickPhoto(top);
    const title = top.title as string | undefined;

    return {
      ...bar,
      photo_url,
      photo_attribution,
      resolved_title: title,
    };
  } catch (err) {
    return { ...bar, error: String(err) };
  }
}

async function main() {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.error("SERPAPI_API_KEY not set");
    process.exit(1);
  }

  const arg = process.argv[2];
  let raw: string;
  if (arg) {
    raw = readFileSync(arg, "utf8");
  } else {
    raw = await new Promise<string>((res) => {
      let buf = "";
      process.stdin.on("data", (c) => (buf += c));
      process.stdin.on("end", () => res(buf));
    });
  }

  const bars = JSON.parse(raw) as BarInput[];
  console.error(`→ looking up photos for ${bars.length} bars (${bars.length} SerpAPI credits)`);

  const results: LookupResult[] = [];
  for (const bar of bars) {
    process.stderr.write(`  ${bar.id} ... `);
    const r = await lookupOne(bar, apiKey);
    results.push(r);
    if (r.error) process.stderr.write(`✗ ${r.error}\n`);
    else if (!r.photo_url) process.stderr.write(`✗ no photo\n`);
    else process.stderr.write(`✓ ${r.photo_url.slice(0, 60)}...\n`);
  }

  console.error("\n=== Results JSON ===");
  console.log(JSON.stringify(results, null, 2));
}

main();
