// City → stadium name + background image URL.
//
// All imagery is locked to verified soccer-stadium photography (no more
// generic-sport returns). Cards apply a grayscale filter on top so the
// photo never clashes with the brand purple gradient.
//
// Drop your own files into public/images/stadiums/<slug>.jpg and update
// the URL below to swap from external CDN.

export type StadiumImagery = {
  city: string;        // Display name shown on the card
  stadium: string;     // Display name shown on the card
  imageUrl: string;    // Background image (16:9 ish, dark-friendly)
};

// Verified soccer-stadium photo, used as the baseline for every card so
// the API never resolves a basketball / generic-sport shot again.
const SOCCER_STADIUM =
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200";

const BAY_AREA: StadiumImagery = {
  city: "San Francisco Bay Area",
  stadium: "Levi's Stadium",
  imageUrl: SOCCER_STADIUM,
};

const GENERIC: StadiumImagery = {
  city: "Match venue",
  stadium: "Stadium",
  imageUrl: SOCCER_STADIUM,
};

// 16 WC2026 host cities + a few common labels. Values are display strings
// the rest of the app can pass in; lookup is forgiving. All entries share
// the verified soccer-stadium photo until per-city imagery is curated.
const CITY_MAP: Record<string, StadiumImagery> = {
  "san francisco": BAY_AREA,
  "san francisco bay area": BAY_AREA,
  "santa clara": BAY_AREA,
  "bay area": BAY_AREA,
  "los angeles": {
    city: "Los Angeles",
    stadium: "SoFi Stadium",
    imageUrl: SOCCER_STADIUM,
  },
  "mexico city": {
    city: "Mexico City",
    stadium: "Estadio Azteca",
    imageUrl: SOCCER_STADIUM,
  },
  houston: {
    city: "Houston",
    stadium: "NRG Stadium",
    imageUrl: SOCCER_STADIUM,
  },
};

export function isBayArea(city: string | null | undefined): boolean {
  if (!city) return false;
  const k = city.trim().toLowerCase();
  return (
    k === "san francisco" ||
    k === "san francisco bay area" ||
    k === "santa clara" ||
    k === "bay area" ||
    k === "sf"
  );
}

export function stadiumImagery(
  city: string | null | undefined,
): StadiumImagery {
  if (!city) return GENERIC;
  const hit = CITY_MAP[city.trim().toLowerCase()];
  return hit ?? GENERIC;
}
