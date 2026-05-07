// 2026 FIFA World Cup — qualified teams (48 slots).
// Source list as of 2026-05; verify against the official draw before shipping
// publicly. Inter-confederation playoff winners are the most volatile — edit
// here when results land.

export type WCTeam = {
  code: string;
  name: string;
};

export const WC_2026_TEAMS: WCTeam[] = [
  // Hosts
  { code: "USA", name: "United States" },
  { code: "MEX", name: "Mexico" },
  { code: "CAN", name: "Canada" },

  // UEFA (16)
  { code: "ENG", name: "England" },
  { code: "FRA", name: "France" },
  { code: "GER", name: "Germany" },
  { code: "ESP", name: "Spain" },
  { code: "POR", name: "Portugal" },
  { code: "NED", name: "Netherlands" },
  { code: "BEL", name: "Belgium" },
  { code: "CRO", name: "Croatia" },
  { code: "SUI", name: "Switzerland" },
  { code: "AUT", name: "Austria" },
  { code: "NOR", name: "Norway" },
  { code: "TUR", name: "Türkiye" },
  { code: "SCO", name: "Scotland" },
  { code: "CZE", name: "Czechia" },
  { code: "SWE", name: "Sweden" },
  { code: "BIH", name: "Bosnia & Herzegovina" },

  // CONMEBOL (6)
  { code: "ARG", name: "Argentina" },
  { code: "BRA", name: "Brazil" },
  { code: "URU", name: "Uruguay" },
  { code: "COL", name: "Colombia" },
  { code: "ECU", name: "Ecuador" },
  { code: "PAR", name: "Paraguay" },

  // CONCACAF (3 + 3 hosts already counted)
  { code: "PAN", name: "Panama" },
  { code: "HAI", name: "Haiti" },
  { code: "CUW", name: "Curaçao" },

  // CAF (9 + Cabo Verde via inter-confederation playoff)
  { code: "MAR", name: "Morocco" },
  { code: "TUN", name: "Tunisia" },
  { code: "EGY", name: "Egypt" },
  { code: "ALG", name: "Algeria" },
  { code: "GHA", name: "Ghana" },
  { code: "SEN", name: "Senegal" },
  { code: "CIV", name: "Côte d'Ivoire" },
  { code: "RSA", name: "South Africa" },
  { code: "COD", name: "Congo DR" },
  { code: "CPV", name: "Cabo Verde" },

  // AFC
  { code: "JPN", name: "Japan" },
  { code: "KOR", name: "Korea Republic" },
  { code: "AUS", name: "Australia" },
  { code: "IRN", name: "Iran" },
  { code: "KSA", name: "Saudi Arabia" },
  { code: "UZB", name: "Uzbekistan" },
  { code: "JOR", name: "Jordan" },
  { code: "IRQ", name: "Iraq" },
  { code: "QAT", name: "Qatar" },

  // OFC (1)
  { code: "NZL", name: "New Zealand" },
];

export const SF_OFFICIAL_FAN_ZONES = [
  "thrive-city",
  "china-basin-park-mission-rock",
  "the-crossing-east-cut",
  "yerba-buena-lane",
  "pier-39",
  "the-midway",
];

export function getTeamByCode(code: string): WCTeam | null {
  const upper = code.toUpperCase();
  return WC_2026_TEAMS.find((t) => t.code === upper) ?? null;
}
