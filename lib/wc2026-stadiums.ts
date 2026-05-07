// Catalog of every WC2026 host venue. The schedule references these by
// `id`; stadium-imagery.ts looks up display strings + photo via the same id.
//
// Photo URLs all share the verified soccer-stadium asset for now — swap in
// per-stadium imagery later as it's curated.

export type WC2026Stadium = {
  id: string;
  name: string;
  city: string;       // Display label shown on cards
  isBayArea: boolean;
};

export const WC2026_STADIUMS: WC2026Stadium[] = [
  // United States
  { id: "levis-bay-area",   name: "Levi's Stadium",                   city: "San Francisco Bay Area", isBayArea: true  },
  { id: "sofi-la",          name: "SoFi Stadium",                     city: "Los Angeles",            isBayArea: false },
  { id: "lumen-seattle",    name: "Lumen Field",                      city: "Seattle",                isBayArea: false },
  { id: "nrg-houston",      name: "NRG Stadium",                      city: "Houston",                isBayArea: false },
  { id: "att-dallas",       name: "AT&T Stadium",                     city: "Dallas",                 isBayArea: false },
  { id: "arrowhead-kc",     name: "GEHA Field at Arrowhead Stadium",  city: "Kansas City",            isBayArea: false },
  { id: "mb-atlanta",       name: "Mercedes-Benz Stadium",            city: "Atlanta",                isBayArea: false },
  { id: "hardrock-miami",   name: "Hard Rock Stadium",                city: "Miami",                  isBayArea: false },
  { id: "gillette-boston",  name: "Gillette Stadium",                 city: "Boston",                 isBayArea: false },
  { id: "lincoln-philly",   name: "Lincoln Financial Field",          city: "Philadelphia",           isBayArea: false },
  { id: "metlife-nynj",     name: "MetLife Stadium",                  city: "New York / New Jersey", isBayArea: false },
  // Canada
  { id: "bcplace-vancouver", name: "BC Place",                        city: "Vancouver",              isBayArea: false },
  { id: "bmofield-toronto",  name: "BMO Field",                       city: "Toronto",                isBayArea: false },
  // Mexico
  { id: "akron-guadalajara", name: "Estadio Akron",                   city: "Guadalajara",            isBayArea: false },
  { id: "azteca-mexicocity", name: "Estadio Azteca",                  city: "Mexico City",            isBayArea: false },
  { id: "bbva-monterrey",    name: "Estadio BBVA",                    city: "Monterrey",              isBayArea: false },
];

const BY_ID = new Map(WC2026_STADIUMS.map((s) => [s.id, s]));

export function getStadiumById(id: string): WC2026Stadium | null {
  return BY_ID.get(id) ?? null;
}
