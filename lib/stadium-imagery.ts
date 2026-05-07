// City / stadium → background image URL.
//
// All imagery is locked to verified soccer-stadium photography (no more
// generic-sport returns). Cards apply a grayscale filter on top so the
// photo never clashes with the brand purple gradient.
//
// Drop your own files into public/images/stadiums/<slug>.jpg and update
// the URL below to swap from external CDN.

import { WC2026_STADIUMS, getStadiumById } from "./wc2026-stadiums";

export type StadiumImagery = {
  city: string;        // Display name shown on the card
  stadium: string;     // Display name shown on the card
  imageUrl: string;    // Background image (16:9 ish, dark-friendly)
};

// Verified soccer-stadium photo, used as the baseline for every card so
// the API never resolves a basketball / generic-sport shot again.
const SOCCER_STADIUM =
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200";

const GENERIC: StadiumImagery = {
  city: "Match venue",
  stadium: "Stadium",
  imageUrl: SOCCER_STADIUM,
};

// City-name lookup (forgiving). Some callers only know the host city
// label; map them through the WC2026_STADIUMS catalog by city match.
const CITY_LOOKUP: Record<string, string> = (() => {
  const m: Record<string, string> = {
    "san francisco": "levis-bay-area",
    "san francisco bay area": "levis-bay-area",
    "santa clara": "levis-bay-area",
    "bay area": "levis-bay-area",
    sf: "levis-bay-area",
  };
  for (const s of WC2026_STADIUMS) {
    m[s.city.toLowerCase()] = s.id;
  }
  return m;
})();

export function isBayArea(city: string | null | undefined): boolean {
  if (!city) return false;
  const id = CITY_LOOKUP[city.trim().toLowerCase()];
  if (!id) return false;
  return getStadiumById(id)?.isBayArea ?? false;
}

export function stadiumImagery(
  city: string | null | undefined,
): StadiumImagery {
  if (!city) return GENERIC;
  const id = CITY_LOOKUP[city.trim().toLowerCase()];
  if (!id) return GENERIC;
  const s = getStadiumById(id);
  if (!s) return GENERIC;
  return { city: s.city, stadium: s.name, imageUrl: SOCCER_STADIUM };
}

// Direct stadium-id lookup — preferred when the caller already has the
// catalog id (e.g. the schedule constant).
export function stadiumImageryById(id: string): StadiumImagery {
  const s = getStadiumById(id);
  if (!s) return GENERIC;
  return { city: s.city, stadium: s.name, imageUrl: SOCCER_STADIUM };
}
