import { createReadClient } from "./supabase/server";
import type {
  AffinityConfidence,
  AffinityRole,
  Country,
  CrowdStatusRow,
  Fixture,
  Venue,
  VenueAtmosphere,
  VenueMatchRules,
} from "./types";
import type { VenueWithRelations } from "./matchday";

type VenueRow = Venue & {
  venue_atmosphere: VenueAtmosphere | VenueAtmosphere[] | null;
  venue_match_rules: VenueMatchRules | VenueMatchRules[] | null;
};

function flattenVenue(row: VenueRow): VenueWithRelations {
  const atmosphere = Array.isArray(row.venue_atmosphere)
    ? row.venue_atmosphere[0] ?? null
    : row.venue_atmosphere;
  const match_rules = Array.isArray(row.venue_match_rules)
    ? row.venue_match_rules[0] ?? null
    : row.venue_match_rules;
  // Don't let the nested objects bleed out alongside the flattened fields.
  const { venue_atmosphere: _a, venue_match_rules: _m, ...venue } = row;
  void _a;
  void _m;
  return { ...venue, atmosphere, match_rules };
}

export async function getAllVenues(cityId = "san-francisco"): Promise<VenueWithRelations[]> {
  const db = createReadClient();
  const { data, error } = await db
    .from("venues")
    .select("*, venue_atmosphere(*), venue_match_rules(*)")
    .eq("city_id", cityId)
    .eq("active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as VenueRow[]).map(flattenVenue);
}

export async function getVenueById(id: string): Promise<VenueWithRelations | null> {
  const db = createReadClient();
  const { data, error } = await db
    .from("venues")
    .select("*, venue_atmosphere(*), venue_match_rules(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return flattenVenue(data as VenueRow);
}

export async function getAllFixtures(cityId = "san-francisco"): Promise<Fixture[]> {
  const db = createReadClient();
  const { data, error } = await db
    .from("fixtures")
    .select("*")
    .eq("city_id", cityId)
    .order("kickoff_utc", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Fixture[];
}

export async function getFixtureById(id: string): Promise<Fixture | null> {
  const db = createReadClient();
  const { data, error } = await db
    .from("fixtures")
    .select("*")
    .eq("match_id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Fixture) ?? null;
}

export async function getUpcomingFixtures(
  cityId = "san-francisco",
  limit = 6,
  now: Date = new Date(),
): Promise<Fixture[]> {
  const db = createReadClient();
  const { data, error } = await db
    .from("fixtures")
    .select("*")
    .eq("city_id", cityId)
    .gte("kickoff_utc", now.toISOString())
    .order("kickoff_utc", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Fixture[];
}

// Countries ----------------------------------------------------------------

export async function getAllCountries(cityId = "san-francisco"): Promise<Country[]> {
  const db = createReadClient();
  const { data, error } = await db
    .from("countries")
    .select("*")
    .eq("city_id", cityId)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Country[];
}

export async function getCountryByCode(code: string): Promise<Country | null> {
  const db = createReadClient();
  const { data, error } = await db
    .from("countries")
    .select("*")
    .eq("country_code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return (data as Country) ?? null;
}

const ROLE_RANK: Record<AffinityRole, number> = {
  home_bar: 0,
  themed: 1,
  cluster_lead: 2,
  general_soccer: 3,
};

const CONFIDENCE_RANK: Record<AffinityConfidence, number> = {
  very_high: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export type RankedBar = {
  venue: VenueWithRelations;
  role: AffinityRole;
  confidence: AffinityConfidence;
};

// Returns bars curated to this country's fan crowd: only those with an
// explicit `bar_country_affinity` row. Sorted by (role, confidence, name)
// so home_bar / very_high lands first.
export async function getRankedBarsForCountry(code: string): Promise<RankedBar[]> {
  const db = createReadClient();
  const { data, error } = await db
    .from("bar_country_affinity")
    .select(
      "role, confidence, venues(*, venue_atmosphere(*), venue_match_rules(*))",
    )
    .eq("country_code", code.toUpperCase());
  if (error) throw error;

  type Row = {
    role: AffinityRole;
    confidence: AffinityConfidence;
    venues: VenueRow | VenueRow[] | null;
  };

  const ranked: RankedBar[] = [];
  for (const r of (data ?? []) as Row[]) {
    const venueRow = Array.isArray(r.venues) ? r.venues[0] : r.venues;
    if (!venueRow || !venueRow.active) continue;
    ranked.push({
      venue: flattenVenue(venueRow),
      role: r.role,
      confidence: r.confidence,
    });
  }

  ranked.sort((a, b) => {
    const ra = ROLE_RANK[a.role];
    const rb = ROLE_RANK[b.role];
    if (ra !== rb) return ra - rb;
    const ca = CONFIDENCE_RANK[a.confidence];
    const cb = CONFIDENCE_RANK[b.confidence];
    if (ca !== cb) return ca - cb;
    return a.venue.name.localeCompare(b.venue.name);
  });

  return ranked;
}

export async function getFanZonesByIds(
  ids: string[],
): Promise<VenueWithRelations[]> {
  if (ids.length === 0) return [];
  const db = createReadClient();
  const { data, error } = await db
    .from("venues")
    .select("*, venue_atmosphere(*), venue_match_rules(*)")
    .in("id", ids);
  if (error) throw error;
  const byId = new Map<string, VenueWithRelations>();
  for (const row of (data ?? []) as VenueRow[]) {
    byId.set(row.id, flattenVenue(row));
  }
  // Preserve the user-provided order from country.fan_zones.
  return ids.map((id) => byId.get(id)).filter((v): v is VenueWithRelations => !!v);
}

// Fetch the N most recent crowd_status rows for a venue (admin/user/external),
// newest first. Callers filter by source / age in the calculator.
export async function getRecentCrowdStatus(
  venueId: string,
  limit = 5,
): Promise<CrowdStatusRow[]> {
  const db = createReadClient();
  const { data, error } = await db
    .from("crowd_status")
    .select("*")
    .eq("venue_id", venueId)
    .order("polled_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as CrowdStatusRow[];
}
