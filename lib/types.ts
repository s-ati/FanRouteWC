export type VenueType =
  | "official_fan_zone"
  | "official_watch_party"
  | "credible_public"
  | "fallback_bar";

export type SourceType =
  | "fifa_official"
  | "city_backed"
  | "partner"
  | "credible_public"
  | "community";

export type IndoorOutdoor = "indoor" | "outdoor" | "mixed";
export type Vibe = "hardcore" | "party" | "family" | "mixed";
export type SoundLikelihood = "high" | "medium" | "low";
export type RelevanceLevel = "primary" | "secondary" | "fallback";

export type Venue = {
  id: string;
  city_id: string;
  name: string;
  type: VenueType;
  source_type: SourceType;
  address: string;
  lat: number;
  lng: number;
  capacity_estimate: number | null;
  indoor_outdoor: IndoorOutdoor;
  food_available: boolean | null;
  drinks_available: boolean | null;
  active: boolean;
  relevance_level: RelevanceLevel;
  likely_showing: boolean;
  source_urls: string[];
  notes: string | null;
  description: string | null;
  last_verified: string;
  place_id: string | null;
  country_affiliations: string[];
  neighborhood: string | null;
  phone: string | null;
  website: string | null;
  photo_url: string | null;
  photo_attribution: string | null;
};

export type FanDemandTier = "very_high" | "high" | "medium" | "low" | "none";
export type AffinityRole = "home_bar" | "themed" | "cluster_lead" | "general_soccer";
export type AffinityConfidence = "very_high" | "high" | "medium" | "low";

export type Country = {
  country_code: string;
  city_id: string;
  name: string;
  fan_demand_tier: FanDemandTier;
  language: string | null;
  match_filter_default: string | null;
  fan_zones: string[];
  notes: string | null;
  last_verified: string;
};

export type BarCountryAffinity = {
  venue_id: string;
  country_code: string;
  role: AffinityRole;
  confidence: AffinityConfidence;
  rank: number | null;
};

export type GamewatchValidation = {
  venue_id: string;
  url: string | null;
  rating: number | null;
  views: number | null;
  local_rank: number | null;
  last_validated: string | null;
};

export type CrowdSource =
  | "serpapi_live"
  | "serpapi_forecast"
  | "outscraper_live"
  | "outscraper_forecast"
  | "user_report"
  | "admin_override";

export type ReportType = "easy_entry" | "some_line" | "full" | "great_vibe";

export type CrowdStatusRow = {
  id: string;
  venue_id: string;
  match_id: string | null;
  raw_busyness_pct: number | null;
  confidence: "open" | "room" | "filling_up" | "packed" | "full";
  source: CrowdSource;
  polled_at: string;
  expires_at: string;
};

export type UserReport = {
  id: string;
  venue_id: string;
  report_type: ReportType;
  device_hash: string;
  submitted_at: string;
};

export type VenueAtmosphere = {
  venue_id: string;
  vibe: Vibe | null;
  team_bias: string | null;
  language: string | null;
  sound_on_likelihood: SoundLikelihood | null;
};

export type VenueMatchRules = {
  venue_id: string;
  match_filter: string | null;
};

export type Fixture = {
  match_id: string;
  city_id: string;
  stage: string;
  home_team: string;
  away_team: string;
  kickoff_local: string;
  kickoff_utc: string;
  played_in_bay_area: boolean;
  host_city: string;
  notes: string | null;
  last_verified: string;
};
