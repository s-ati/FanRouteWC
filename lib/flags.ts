// FIFA 3-letter codes → ISO alpha-2 codes (or null for subnational UK nations,
// which use dedicated Unicode tag sequences rather than regional indicators).
const FIFA_TO_ISO2: Record<string, string | "ENG" | "SCO" | "WAL" | "NIR"> = {
  // Americas
  USA: "US",
  CAN: "CA",
  MEX: "MX",
  ARG: "AR",
  BRA: "BR",
  URU: "UY",
  PAR: "PY",
  COL: "CO",
  ECU: "EC",
  CHI: "CL",
  PER: "PE",
  VEN: "VE",
  BOL: "BO",
  HAI: "HT",
  CRC: "CR",
  HON: "HN",
  PAN: "PA",
  JAM: "JM",

  // Europe
  BIH: "BA",
  ENG: "ENG",
  SCO: "SCO",
  WAL: "WAL",
  NIR: "NIR",
  FRA: "FR",
  GER: "DE",
  ESP: "ES",
  POR: "PT",
  NED: "NL",
  BEL: "BE",
  ITA: "IT",
  CRO: "HR",
  SUI: "CH",
  AUT: "AT",
  NOR: "NO",
  SWE: "SE",
  DEN: "DK",
  POL: "PL",
  CZE: "CZ",
  UKR: "UA",
  TUR: "TR",
  SRB: "RS",
  IRL: "IE",
  ISL: "IS",
  HUN: "HU",
  ROU: "RO",
  SVK: "SK",
  SVN: "SI",
  BUL: "BG",
  GRE: "GR",
  FIN: "FI",

  // Africa
  RSA: "ZA",
  MAR: "MA",
  ALG: "DZ",
  TUN: "TN",
  EGY: "EG",
  SEN: "SN",
  CIV: "CI",
  NGA: "NG",
  GHA: "GH",
  CMR: "CM",
  MLI: "ML",
  CPV: "CV",
  COD: "CD",
  CGO: "CG",
  KEN: "KE",
  UGA: "UG",
  ZAM: "ZM",
  ZIM: "ZW",

  // Asia / AFC
  JPN: "JP",
  KOR: "KR",
  PRK: "KP",
  AUS: "AU",
  IRN: "IR",
  IRQ: "IQ",
  KSA: "SA",
  QAT: "QA",
  UAE: "AE",
  UZB: "UZ",
  JOR: "JO",
  SYR: "SY",
  CHN: "CN",
  IND: "IN",
  THA: "TH",
  VIE: "VN",
  IDN: "ID",
  MAS: "MY",
  PHI: "PH",
  LBN: "LB",

  // OFC
  NZL: "NZ",
  SOL: "SB",
  FIJ: "FJ",

  // Misc / historical codes that sometimes appear
  CUW: "CW", // Curaçao
};

// ISO alpha-2 → regional-indicator-symbol emoji (e.g. "US" → 🇺🇸).
function iso2ToEmoji(iso2: string): string {
  const base = 0x1f1e6; // regional indicator A
  return [...iso2.toUpperCase()]
    .map((c) => String.fromCodePoint(base + c.charCodeAt(0) - 65))
    .join("");
}

// Subnational flags (England, Scotland, Wales, N. Ireland) use Unicode tag
// sequences — the 🏴 base + tags spelling "gbeng", "gbsct", etc. + terminator.
const SUBNATIONAL_FLAGS: Record<string, string> = {
  ENG: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
  SCO: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
  WAL: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}",
  // N. Ireland has no standard emoji tag sequence; fall back to UK flag.
  NIR: iso2ToEmoji("GB"),
};

export function flagEmoji(fifaCode: string): string {
  if (!fifaCode) return "";
  const code = fifaCode.trim().toUpperCase();
  if (code === "TBD") return "";
  const mapped = FIFA_TO_ISO2[code];
  if (!mapped) return "";
  if (mapped in SUBNATIONAL_FLAGS) return SUBNATIONAL_FLAGS[mapped];
  return iso2ToEmoji(mapped);
}
