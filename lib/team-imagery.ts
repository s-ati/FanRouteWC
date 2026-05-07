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

const TEAM_FOLDERS: Record<string, string> = {
  GER: "germany",
  USA: "usa",
  MEX: "mexico",
  ENG: "england",
  ARG: "argentina",
  BRA: "brazil",
  FRA: "france",
  ESP: "spain",
  POR: "portugal",
  NED: "netherlands",
  ITA: "italy",
  KOR: "korea",
  JPN: "japan",
  IRL: "ireland",
  SCO: "scotland",
  AUS: "australia",
  BEL: "belgium",
  SUI: "switzerland",
  GHA: "ghana",
  SEN: "senegal",
  NGA: "nigeria",
  CIV: "ivory-coast",
  URU: "uruguay",
  MAR: "morocco",
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
