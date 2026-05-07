import { readFileSync } from "node:fs";
import { load as parseYaml } from "js-yaml";
import type {
  AffinityConfidence,
  AffinityRole,
  BarCountryAffinity,
  GamewatchValidation,
  Venue,
  VenueAtmosphere,
  VenueMatchRules,
} from "../types";

export type ParsedVenue = {
  venue: Venue;
  atmosphere: VenueAtmosphere;
  matchRules: VenueMatchRules;
  affinities: BarCountryAffinity[];
  gamewatch: GamewatchValidation | null;
};

const ROLE_VALUES: AffinityRole[] = [
  "home_bar",
  "themed",
  "cluster_lead",
  "general_soccer",
];
const CONFIDENCE_VALUES: AffinityConfidence[] = [
  "very_high",
  "high",
  "medium",
  "low",
];

// Treat the literal string `TBD` (case-insensitive) as "unknown" and persist as null.
const TBD = (value: unknown): value is string =>
  typeof value === "string" && value.trim().toUpperCase() === "TBD";

function nullIfTBD<T>(value: T | string | undefined | null): T | null {
  if (value === undefined || value === null) return null;
  if (TBD(value)) return null;
  return value as T;
}

function toBool(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (TBD(value)) return null;
  if (value === null || value === undefined) return null;
  throw new Error(`Expected boolean or TBD, got ${JSON.stringify(value)}`);
}

function toInt(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (TBD(value)) return null;
  if (value === null || value === undefined) return null;
  throw new Error(`Expected integer or TBD, got ${JSON.stringify(value)}`);
}

// js-yaml converts `2026-04-21` into a Date at midnight UTC.
// Re-serialize to YYYY-MM-DD so Postgres `date` receives a clean string.
function toIsoDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") return value;
  throw new Error(`Expected date, got ${JSON.stringify(value)}`);
}

type RawVenue = Record<string, unknown>;

function splitIntoBlocks(fileContent: string): string[] {
  // Split on lines that are exactly "---" (optional trailing whitespace).
  // The file layout is:
  //   [""]         — before first ---
  //   [file YAML]
  //   [city prose]
  //   [venue 1 YAML]
  //   [venue 1 prose]
  //   [venue 2 YAML]
  //   ...
  return fileContent.split(/^---[ \t]*$/m);
}

function extractDescriptionFromProse(prose: string): string | null {
  // Strip the leading "# <heading>" line and return trimmed body text, or null if empty.
  const withoutHeading = prose.replace(/^\s*#\s+.*$/m, "").trim();
  return withoutHeading.length > 0 ? withoutHeading : null;
}

export function parseVenuesFile(path: string): ParsedVenue[] {
  const content = readFileSync(path, "utf8");
  const blocks = splitIntoBlocks(content);

  // blocks[0] is whatever preceded the first "---" (should be empty/whitespace).
  // blocks[1] is the file-level frontmatter.
  // blocks[2] is the city intro prose.
  // From blocks[3] onward, alternating: venue YAML, venue prose.
  if (blocks.length < 4) {
    throw new Error(
      `Expected at least one venue block in ${path}, found ${blocks.length - 3}`,
    );
  }

  const results: ParsedVenue[] = [];

  for (let i = 3; i < blocks.length; i += 2) {
    const yamlBlock = blocks[i];
    const proseBlock = blocks[i + 1] ?? "";

    const raw = parseYaml(yamlBlock) as RawVenue | null;
    if (!raw || typeof raw !== "object") {
      throw new Error(`Venue block #${(i - 1) / 2} in ${path} did not parse as YAML`);
    }

    const id = String(raw.id ?? "").trim();
    if (!id) throw new Error(`Venue block #${(i - 1) / 2} in ${path} is missing id`);

    // Skip blocks where lat/lng haven't been geocoded yet (e.g., bars-san-francisco.md
    // has 51 entries, only some onboarded). We let the seeder push the geocoded
    // ones and silently skip the rest until they're filled in.
    const latVal = Number(raw.lat);
    const lngVal = Number(raw.lng);
    if (!Number.isFinite(latVal) || !Number.isFinite(lngVal)) {
      console.warn(`  · skipping ${id}: lat/lng not geocoded yet`);
      continue;
    }

    const sourceUrlsRaw = raw.source_urls;
    if (!Array.isArray(sourceUrlsRaw)) {
      throw new Error(`Venue ${id}: source_urls must be a YAML list`);
    }
    const sourceUrls = sourceUrlsRaw.map((u) => String(u).trim()).filter(Boolean);

    const description = extractDescriptionFromProse(proseBlock);

    const placeIdRaw = raw.place_id;
    const place_id =
      placeIdRaw == null || TBD(placeIdRaw)
        ? null
        : String(placeIdRaw).trim() || null;

    const affiliationsRaw = raw.country_affiliations;
    const country_affiliations = Array.isArray(affiliationsRaw)
      ? affiliationsRaw.map((c) => String(c).trim()).filter(Boolean)
      : ["*"];

    const optionalString = (val: unknown): string | null => {
      if (val == null || TBD(val)) return null;
      const s = String(val).trim();
      return s.length > 0 ? s : null;
    };

    const venue: Venue = {
      id,
      city_id: String(raw.city_id),
      name: String(raw.name),
      type: raw.type as Venue["type"],
      source_type: raw.source_type as Venue["source_type"],
      address: String(raw.address),
      lat: Number(raw.lat),
      lng: Number(raw.lng),
      capacity_estimate: toInt(raw.capacity_estimate),
      indoor_outdoor: raw.indoor_outdoor as Venue["indoor_outdoor"],
      food_available: toBool(raw.food_available),
      drinks_available: toBool(raw.drinks_available),
      active: raw.active !== false,
      relevance_level: raw.relevance_level as Venue["relevance_level"],
      likely_showing: raw.likely_showing !== false,
      source_urls: sourceUrls,
      notes: raw.notes != null ? String(raw.notes).trim() : null,
      description,
      last_verified: toIsoDate(raw.last_verified),
      place_id,
      country_affiliations,
      neighborhood: optionalString(raw.neighborhood),
      phone: optionalString(raw.phone),
      website: optionalString(raw.website),
      photo_url: optionalString(raw.photo_url),
      photo_attribution: optionalString(raw.photo_attribution),
    };

    const affinityRaw = raw.country_affinity;
    const affinities: BarCountryAffinity[] = [];
    if (Array.isArray(affinityRaw)) {
      affinityRaw.forEach((entry, idx) => {
        if (!entry || typeof entry !== "object") return;
        const e = entry as Record<string, unknown>;
        const country_code = optionalString(e.country);
        const role = optionalString(e.role);
        const confidence = optionalString(e.confidence);
        if (!country_code || !role || !confidence) return;
        if (!ROLE_VALUES.includes(role as AffinityRole)) {
          throw new Error(
            `Venue ${id}: country_affinity[${idx}].role "${role}" not in enum`,
          );
        }
        if (!CONFIDENCE_VALUES.includes(confidence as AffinityConfidence)) {
          throw new Error(
            `Venue ${id}: country_affinity[${idx}].confidence "${confidence}" not in enum`,
          );
        }
        affinities.push({
          venue_id: id,
          country_code: country_code.toUpperCase(),
          role: role as AffinityRole,
          confidence: confidence as AffinityConfidence,
          rank: idx + 1,
        });
      });
    }

    const gwRaw = raw.gamewatch;
    let gamewatch: GamewatchValidation | null = null;
    if (gwRaw && typeof gwRaw === "object") {
      const g = gwRaw as Record<string, unknown>;
      const url = optionalString(g.url);
      const ratingNum =
        typeof g.rating === "number"
          ? g.rating
          : typeof g.rating === "string" && !TBD(g.rating)
            ? Number(g.rating)
            : null;
      const viewsNum =
        typeof g.views === "number"
          ? g.views
          : typeof g.views === "string" && !TBD(g.views)
            ? Number(g.views)
            : null;
      const localRankNum =
        typeof g.local_rank === "number"
          ? g.local_rank
          : typeof g.local_rank === "string" && !TBD(g.local_rank)
            ? Number(g.local_rank)
            : null;
      gamewatch = {
        venue_id: id,
        url,
        rating: ratingNum != null && Number.isFinite(ratingNum) ? ratingNum : null,
        views: viewsNum != null && Number.isFinite(viewsNum) ? viewsNum : null,
        local_rank:
          localRankNum != null && Number.isFinite(localRankNum) ? localRankNum : null,
        last_validated: optionalString(g.last_validated),
      };
    }

    const atmosphere: VenueAtmosphere = {
      venue_id: id,
      vibe: nullIfTBD(raw.vibe) as VenueAtmosphere["vibe"],
      team_bias: nullIfTBD(raw.team_bias) as string | null,
      language: nullIfTBD(raw.language) as string | null,
      sound_on_likelihood: nullIfTBD(
        raw.sound_on_likelihood,
      ) as VenueAtmosphere["sound_on_likelihood"],
    };

    const matchRules: VenueMatchRules = {
      venue_id: id,
      match_filter: nullIfTBD(raw.match_filter) as string | null,
    };

    results.push({ venue, atmosphere, matchRules, affinities, gamewatch });
  }

  return results;
}
