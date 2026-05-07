// One-shot: take a JSON list of {id, name, address} bars and fetch
// place_id + lat/lng from SerpAPI's google_maps engine. Prints a YAML
// snippet you can paste back into bars-san-francisco.md.
//
// Run: tsx scripts/lookup-bar-place-ids.ts < /tmp/bars-16.json
//      tsx scripts/lookup-bar-place-ids.ts /tmp/bars-16.json
//
// Cost: 1 SerpAPI credit per bar.

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
  place_id?: string;
  lat?: number;
  lng?: number;
  resolved_title?: string;
  resolved_address?: string;
  error?: string;
};

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

    // Two possible shapes:
    // 1. place_results — when the query resolves to a single canonical place
    // 2. local_results[] — when it returns a search list; we take the first
    const place = json.place_results as Record<string, unknown> | undefined;
    const local = (json.local_results as Array<Record<string, unknown>> | undefined) ?? [];
    const top = place ?? local[0];

    if (!top) {
      return { ...bar, error: "no result" };
    }

    const pid = top.place_id as string | undefined;
    const gps = top.gps_coordinates as
      | { latitude?: number; longitude?: number }
      | undefined;
    const title = top.title as string | undefined;
    const addr = top.address as string | undefined;

    return {
      ...bar,
      place_id: pid,
      lat: gps?.latitude,
      lng: gps?.longitude,
      resolved_title: title,
      resolved_address: addr,
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
  console.error(`→ looking up ${bars.length} bars (${bars.length} SerpAPI credits)`);

  const results: LookupResult[] = [];
  for (const bar of bars) {
    process.stderr.write(`  ${bar.id} ... `);
    const r = await lookupOne(bar, apiKey);
    results.push(r);
    if (r.error) process.stderr.write(`✗ ${r.error}\n`);
    else if (!r.place_id) process.stderr.write(`✗ no place_id\n`);
    else process.stderr.write(`✓ ${r.place_id.slice(0, 12)}... (${r.lat?.toFixed(4)}, ${r.lng?.toFixed(4)})\n`);
  }

  console.error("\n=== Results JSON ===");
  console.log(JSON.stringify(results, null, 2));
}

main();
