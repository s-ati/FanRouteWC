import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Team-specific hero imagery. Folder convention:
//   public/images/teams/<slug>/*.{jpg,jpeg,png,webp}
//
// Drop any number of images into that folder — they're all picked up
// at request time (server component reads fs). Filenames are sorted
// alphabetically so prefixing with `01-`, `02-` controls order.
//
// Slug map below resolves a 3-letter FIFA code to a folder name.
// Add an entry for each team you've sourced photos for.

// All WC2026 codes pre-wired so any pick resolves a folder. Drop photos
// into the matching folder under public/images/teams/ and they auto-load.
const TEAM_FOLDERS: Record<string, string> = {
  USA: "usa",
  MEX: "mexico",
  CAN: "canada",
  ENG: "england",
  FRA: "france",
  GER: "germany",
  ESP: "spain",
  POR: "portugal",
  NED: "netherlands",
  BEL: "belgium",
  ITA: "italy",
  CRO: "croatia",
  SUI: "switzerland",
  AUT: "austria",
  POL: "poland",
  NOR: "norway",
  DEN: "denmark",
  TUR: "turkiye",
  SCO: "scotland",
  IRL: "ireland",
  ARG: "argentina",
  BRA: "brazil",
  URU: "uruguay",
  COL: "colombia",
  ECU: "ecuador",
  PAR: "paraguay",
  JAM: "jamaica",
  CRC: "costa-rica",
  PAN: "panama",
  MAR: "morocco",
  TUN: "tunisia",
  EGY: "egypt",
  ALG: "algeria",
  GHA: "ghana",
  SEN: "senegal",
  CIV: "ivory-coast",
  NGA: "nigeria",
  CMR: "cameroon",
  JPN: "japan",
  KOR: "korea",
  AUS: "australia",
  IRN: "iran",
  KSA: "saudi-arabia",
  UZB: "uzbekistan",
  JOR: "jordan",
  IRQ: "iraq",
  NZL: "new-zealand",
  BOL: "bolivia",
  CPV: "cape-verde",
};

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const ROOT = join(process.cwd(), "public", "images", "teams");

export function teamHeroImages(code: string | null | undefined): string[] {
  if (!code) return [];
  const slug = TEAM_FOLDERS[code.toUpperCase()];
  if (!slug) return [];

  const dir = join(ROOT, slug);
  if (!existsSync(dir)) return [];

  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }

  return entries
    .filter((name) => {
      const lower = name.toLowerCase();
      const dot = lower.lastIndexOf(".");
      if (dot < 0) return false;
      return IMAGE_EXTS.has(lower.slice(dot));
    })
    .filter((name) => !name.startsWith(".")) // skip .DS_Store etc.
    .sort()
    .map((name) => `/images/teams/${slug}/${name}`);
}
