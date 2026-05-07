import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { createAdminClient } from "../lib/supabase/server";
import { parseVenuesFile } from "../lib/data/parse-venues";
import { parseFixturesFile } from "../lib/data/parse-fixtures";
import { parseCountriesFile } from "../lib/data/parse-countries";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

// Load .env.local then .env (first wins).
loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

const DRY_RUN = process.argv.includes("--dry");

async function main() {
  const dataDir = resolve(
    process.cwd(),
    process.env.FANROUTE_DATA_DIR ?? "../Sammy/05-project-notes/fanroute/data",
  );

  const venuesPath = resolve(dataDir, "venues-san-francisco.md");
  const barsPath = resolve(dataDir, "bars-san-francisco.md");
  const fixturesPath = resolve(dataDir, "fixtures-san-francisco.md");
  const countriesPath = resolve(dataDir, "countries-san-francisco.md");

  if (!existsSync(venuesPath)) throw new Error(`Missing venues file: ${venuesPath}`);
  if (!existsSync(fixturesPath)) throw new Error(`Missing fixtures file: ${fixturesPath}`);

  console.log(`→ parsing venues from ${venuesPath}`);
  const parsedWatchParties = parseVenuesFile(venuesPath);
  console.log(`  parsed ${parsedWatchParties.length} watch-party venues`);

  let parsedBars: typeof parsedWatchParties = [];
  if (existsSync(barsPath)) {
    console.log(`→ parsing bars from ${barsPath}`);
    parsedBars = parseVenuesFile(barsPath);
    console.log(`  parsed ${parsedBars.length} fallback bars`);
  }

  const parsedVenues = [...parsedWatchParties, ...parsedBars];
  console.log(`  total venues to upsert: ${parsedVenues.length}`);

  const affinityRows = parsedVenues.flatMap((p) => p.affinities);
  const gamewatchRows = parsedVenues
    .map((p) => p.gamewatch)
    .filter((g): g is NonNullable<typeof g> => g != null);
  console.log(
    `  → ${affinityRows.length} country-affinity rows, ${gamewatchRows.length} gamewatch rows`,
  );

  let countries: ReturnType<typeof parseCountriesFile> = [];
  if (existsSync(countriesPath)) {
    console.log(`→ parsing countries from ${countriesPath}`);
    countries = parseCountriesFile(countriesPath);
    console.log(`  parsed ${countries.length} countries`);
  }

  console.log(`→ parsing fixtures from ${fixturesPath}`);
  const fixtures = parseFixturesFile(fixturesPath);
  console.log(`  parsed ${fixtures.length} fixtures`);

  // Drop affinities that point to countries we didn't successfully parse —
  // the FK would reject them. This shows up if bars reference codes the
  // countries file hasn't onboarded yet (e.g., POL, COL).
  const knownCountryCodes = new Set(countries.map((c) => c.country_code));
  const validAffinities = affinityRows.filter((a) => {
    if (a.country_code === "*") return false;
    if (!knownCountryCodes.has(a.country_code)) {
      console.warn(
        `  · skipping affinity ${a.venue_id} → ${a.country_code} (country not onboarded)`,
      );
      return false;
    }
    return true;
  });

  if (DRY_RUN) {
    console.log("\n--dry flag set — skipping database writes.");
    console.log("sample venue:", JSON.stringify(parsedVenues[0]?.venue, null, 2));
    console.log("sample country:", JSON.stringify(countries[0], null, 2));
    console.log("sample affinity:", JSON.stringify(validAffinities[0], null, 2));
    console.log("sample fixture:", JSON.stringify(fixtures[0], null, 2));
    return;
  }

  const db = createAdminClient();

  console.log(`→ upserting ${parsedVenues.length} venues into Supabase`);
  const venueRows = parsedVenues.map((p) => p.venue);
  const atmosphereRows = parsedVenues.map((p) => p.atmosphere);
  const matchRuleRows = parsedVenues.map((p) => p.matchRules);

  const venueResult = await db.from("venues").upsert(venueRows, { onConflict: "id" });
  if (venueResult.error) throw venueResult.error;

  const atmosphereResult = await db
    .from("venue_atmosphere")
    .upsert(atmosphereRows, { onConflict: "venue_id" });
  if (atmosphereResult.error) throw atmosphereResult.error;

  const matchRulesResult = await db
    .from("venue_match_rules")
    .upsert(matchRuleRows, { onConflict: "venue_id" });
  if (matchRulesResult.error) throw matchRulesResult.error;

  if (countries.length) {
    console.log(`→ upserting ${countries.length} countries`);
    const countriesResult = await db
      .from("countries")
      .upsert(countries, { onConflict: "country_code" });
    if (countriesResult.error) throw countriesResult.error;
  }

  if (validAffinities.length) {
    console.log(`→ upserting ${validAffinities.length} bar_country_affinity rows`);
    const affinityResult = await db
      .from("bar_country_affinity")
      .upsert(validAffinities, { onConflict: "venue_id,country_code" });
    if (affinityResult.error) throw affinityResult.error;
  }

  if (gamewatchRows.length) {
    console.log(`→ upserting ${gamewatchRows.length} gamewatch_validation rows`);
    const gamewatchResult = await db
      .from("gamewatch_validation")
      .upsert(gamewatchRows, { onConflict: "venue_id" });
    if (gamewatchResult.error) throw gamewatchResult.error;
  }

  console.log(`→ upserting ${fixtures.length} fixtures into Supabase`);
  const fixturesResult = await db.from("fixtures").upsert(fixtures, { onConflict: "match_id" });
  if (fixturesResult.error) throw fixturesResult.error;

  console.log("✓ seed complete");
}

main().catch((err) => {
  console.error("✗ seed failed:", err);
  process.exit(1);
});
