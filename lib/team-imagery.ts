// Team-specific hero imagery for the personalized home/country pages.
// Add entries per country code as we license/source photos. Images live
// in `public/images/teams/`.
//
// Constraint for the prototype: only photos of the actual national team
// (players in NT context), 2024 or newer.
//
// Sources for the included Germany set:
//   - wirtz-musiala.jpg  — user upload (Wirtz & Musiala together, 2024+)
//   - wirtz-2024.jpg     — Florian Wirtz, 2024 (Wikimedia, CC BY-SA)
//   - wirtz-2026-2.jpg   — Florian Wirtz, Jan 2026 (Wikimedia, CC BY-SA)

export const TEAM_HERO_IMAGES: Record<string, string[]> = {
  GER: [
    "/images/teams/wirtz-musiala.jpg",
    "/images/teams/wirtz-2024.jpg",
    "/images/teams/wirtz-2026-2.jpg",
  ],
};

export function teamHeroImages(code: string | null | undefined): string[] {
  if (!code) return [];
  return TEAM_HERO_IMAGES[code.toUpperCase()] ?? [];
}
