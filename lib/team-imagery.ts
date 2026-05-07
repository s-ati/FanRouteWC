// Team-specific hero imagery for the personalized home/country pages.
// Add entries per country code as we license/source photos. Images live
// in `public/images/teams/`.
//
// Sources for the included Germany set:
//   - wirtz-musiala.jpg     — user upload (private editorial use)
//   - fan-zone-berlin-{1,2} — © Sandro Halank, CC BY-SA 4.0 (Wikimedia)
//   - team-germany-2018     — Steindy, CC BY-SA 4.0 (Wikimedia)
//   - wirtz-2024            — Granada, CC BY-SA 4.0 (Wikimedia)
//   - germany-japan-wc2022  — Hossein Zohrevand, CC BY 4.0 (Wikimedia)

export const TEAM_HERO_IMAGES: Record<string, string[]> = {
  GER: [
    "/images/teams/wirtz-musiala.jpg",
    "/images/teams/fan-zone-berlin-1.jpg",
    "/images/teams/team-germany-2018.jpg",
    "/images/teams/wirtz-2024.jpg",
    "/images/teams/fan-zone-berlin-2.jpg",
    "/images/teams/germany-japan-wc2022.jpg",
  ],
};

export function teamHeroImages(code: string | null | undefined): string[] {
  if (!code) return [];
  return TEAM_HERO_IMAGES[code.toUpperCase()] ?? [];
}
