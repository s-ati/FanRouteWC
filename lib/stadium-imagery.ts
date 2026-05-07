// City → stadium name + background image URL.
//
// MatchCard reads from this to pick the right architecture shot for each
// fixture. The bay-area branch returns Levi's Stadium imagery; everything
// else falls back to a neutral architectural stadium photo.
//
// Drop your own files into public/images/stadiums/<slug>.jpg and update
// the URL below to swap from external CDN.

export type StadiumImagery = {
  city: string;        // Display name shown on the card
  stadium: string;     // Display name shown on the card
  imageUrl: string;    // Background image (16:9 ish, dark-friendly)
};

const BAY_AREA: StadiumImagery = {
  city: "San Francisco Bay Area",
  stadium: "Levi's Stadium",
  // Levi's Stadium aerial / architecture
  imageUrl:
    "https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?auto=format&fit=crop&w=1600&q=80",
};

const GENERIC: StadiumImagery = {
  city: "Match venue",
  stadium: "Stadium",
  // Architectural stadium dusk shot
  imageUrl:
    "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1600&q=80",
};

// 16 WC2026 host cities + a few common labels. Values are display strings
// the rest of the app can pass in; lookup is forgiving.
const CITY_MAP: Record<string, StadiumImagery> = {
  "san francisco": BAY_AREA,
  "san francisco bay area": BAY_AREA,
  "santa clara": BAY_AREA,
  "bay area": BAY_AREA,
  "los angeles": {
    city: "Los Angeles",
    stadium: "SoFi Stadium",
    imageUrl:
      "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1600&q=80",
  },
  "mexico city": {
    city: "Mexico City",
    stadium: "Estadio Azteca",
    imageUrl:
      "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1600&q=80",
  },
  houston: {
    city: "Houston",
    stadium: "NRG Stadium",
    imageUrl:
      "https://images.unsplash.com/photo-1518398046578-8cca57782e17?auto=format&fit=crop&w=1600&q=80",
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
