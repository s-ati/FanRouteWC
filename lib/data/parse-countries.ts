import { readFileSync } from "node:fs";
import { load as parseYaml } from "js-yaml";
import type { Country, FanDemandTier } from "../types";

const TIER_VALUES: FanDemandTier[] = ["very_high", "high", "medium", "low", "none"];

const TBD = (value: unknown): boolean =>
  typeof value === "string" && value.trim().toUpperCase() === "TBD";

function toIsoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value;
  throw new Error(`Expected date, got ${JSON.stringify(value)}`);
}

function splitIntoBlocks(fileContent: string): string[] {
  return fileContent.split(/^---[ \t]*$/m);
}

export function parseCountriesFile(path: string): Country[] {
  const content = readFileSync(path, "utf8");
  const blocks = splitIntoBlocks(content);

  // Layout matches venues file:
  //   blocks[0]  pre-frontmatter (empty)
  //   blocks[1]  file frontmatter
  //   blocks[2]  intro prose
  //   blocks[3]  country 1 YAML
  //   blocks[4]  country 1 prose
  //   ...
  // Trailing blocks may be markdown sections (Default fan-zone fallback,
  // Implementation hints) — those won't parse as country YAML and we
  // gracefully skip them.

  if (blocks.length < 4) {
    throw new Error(
      `Expected at least one country block in ${path}, found ${blocks.length - 3}`,
    );
  }

  const fileMeta = parseYaml(blocks[1]) as Record<string, unknown> | null;
  const fileCityId = fileMeta && typeof fileMeta.city_id === "string"
    ? fileMeta.city_id
    : "san-francisco";
  const fileLastVerified =
    fileMeta && fileMeta.last_verified
      ? toIsoDate(fileMeta.last_verified)
      : new Date().toISOString().slice(0, 10);

  const results: Country[] = [];

  // Country blocks have no separate prose block — just YAML between two `---`
  // separators — so we step by 1 (unlike the venues file which alternates
  // YAML/prose). Trailing markdown sections (fan-zone fallback, implementation
  // hints) won't parse as country YAML and are skipped.
  for (let i = 3; i < blocks.length; i += 1) {
    const yamlBlock = blocks[i];
    if (!yamlBlock || !yamlBlock.trim()) continue;

    let raw: Record<string, unknown> | null;
    try {
      raw = parseYaml(yamlBlock) as Record<string, unknown> | null;
    } catch {
      // Trailing markdown sections aren't valid YAML; skip them.
      continue;
    }
    if (!raw || typeof raw !== "object") continue;
    if (typeof raw.country_code !== "string") continue;

    const country_code = String(raw.country_code).trim().toUpperCase();
    if (!country_code) continue;

    const tierRaw = String(raw.fan_demand_tier ?? "").trim();
    if (!TIER_VALUES.includes(tierRaw as FanDemandTier)) {
      throw new Error(
        `Country ${country_code}: fan_demand_tier "${tierRaw}" not in enum`,
      );
    }

    const fanZonesRaw = raw.fan_zones;
    const fan_zones = Array.isArray(fanZonesRaw)
      ? fanZonesRaw.map((z) => String(z).trim()).filter(Boolean)
      : [];

    const optionalString = (val: unknown): string | null => {
      if (val == null || TBD(val)) return null;
      const s = String(val).trim();
      return s.length > 0 ? s : null;
    };

    results.push({
      country_code,
      city_id: fileCityId,
      name: String(raw.name ?? country_code),
      fan_demand_tier: tierRaw as FanDemandTier,
      language: optionalString(raw.language),
      match_filter_default: optionalString(raw.match_filter_default),
      fan_zones,
      notes:
        raw.notes != null && !TBD(raw.notes) ? String(raw.notes).trim() : null,
      last_verified:
        raw.last_verified != null
          ? toIsoDate(raw.last_verified)
          : fileLastVerified,
    });
  }

  return results;
}
