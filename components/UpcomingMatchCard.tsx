import Link from "next/link";
import { flagEmoji } from "@/lib/flags";
import { getTeamByCode } from "@/lib/wc2026-teams";
import type { MatchCardData } from "@/lib/wc2026-matches";

// "Architecture & Anthem" match card.
//   - Soccer-stadium architecture as the background image (grayscale so it
//     reads as a brand-neutral texture instead of fighting the purple gradient)
//   - Dark purple/lavender → black gradient overlay
//   - Glassmorphism panel on the text container, deep enough that the
//     white type stays readable over any image
//   - Hover: image scales up, overlay brightens to highlight team colors

export type UpcomingMatchData = MatchCardData;

// Highlights the followed/feature team's name + flag at large size, with
// the opponent shown smaller. Falls back to the home team if no team is
// involved (defensive).
function pickFeatureTeam(data: MatchCardData): {
  featureCode: string;
  featureName: string;
  opponentCode: string;
  opponentName: string;
  isHome: boolean;
} {
  const homeName = getTeamByCode(data.homeCode)?.name ?? data.homeCode;
  const awayName = getTeamByCode(data.awayCode)?.name ?? data.awayCode;
  // Default: render with the home team featured.
  return {
    featureCode: data.homeCode,
    featureName: homeName,
    opponentCode: data.awayCode,
    opponentName: awayName,
    isHome: true,
  };
}

export default function UpcomingMatchCard({
  data,
  featureTeam,
}: {
  data: MatchCardData;
  // Optional: render this 3-letter code as the prominent side. When the
  // page has a team focus (country route, "Following Germany" home), pass
  // it so the card reads as that team's match instead of generic.
  featureTeam?: string | null;
}) {
  const base = pickFeatureTeam(data);
  let feature = base;
  if (featureTeam) {
    const upper = featureTeam.toUpperCase();
    if (data.awayCode === upper && data.homeCode !== upper) {
      const awayName = getTeamByCode(data.awayCode)?.name ?? data.awayCode;
      const homeName = getTeamByCode(data.homeCode)?.name ?? data.homeCode;
      feature = {
        featureCode: data.awayCode,
        featureName: awayName,
        opponentCode: data.homeCode,
        opponentName: homeName,
        isHome: false,
      };
    }
  }

  return (
    <Link
      href={`/matches/${data.matchId}`}
      className="group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-xl border border-outline-variant bg-black text-white shadow-ambient transition hover:-translate-y-[2px] hover:border-primary hover:shadow-lg"
    >
      {/* Background image — grayscale baseline, zooms on hover */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        style={{
          backgroundImage: `url(${data.backgroundUrl})`,
          filter: "grayscale(100%)",
        }}
      />

      {/* Navy multiply wash — sinks the stadium image into the page bg
          per the Deep Navy FIFA spec (#00175F at 60%). */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(0, 23, 95, 0.6)",
          mixBlendMode: "multiply",
        }}
      />
      {/* Cyan-on-navy diagonal accent that brightens on hover */}
      <div
        aria-hidden
        className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-90"
        style={{
          background:
            "linear-gradient(to right, rgba(0, 23, 95, 0.85), rgba(0, 163, 224, 0.18))",
        }}
      />
      {/* Bottom darken so the glass meta panel always has a clean bed */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-[#00175F] via-[rgba(0,23,95,0.4)] to-transparent"
      />

      {/* Top: group chip + bay-area chip */}
      <div className="relative z-10 flex items-start justify-between p-4">
        {data.group ? (
          <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-sm backdrop-blur-md">
            {data.group}
          </span>
        ) : (
          <span />
        )}
        {data.isBayArea ? (
          <span className="rounded-full border border-white/30 bg-white/15 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-white shadow-sm backdrop-blur-md">
            Bay Area
          </span>
        ) : null}
      </div>

      {/* Hero team — large flag + name, sits above the meta panel */}
      <div className="relative z-10 px-4">
        <div className="flex items-center gap-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
          <span aria-hidden className="text-5xl leading-none">
            {flagEmoji(feature.featureCode) || "🏳️"}
          </span>
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
              {feature.isHome ? "HOME" : "AWAY"} · {feature.featureCode}
            </p>
            <p className="text-2xl font-bold leading-tight text-white">
              {feature.featureName}
            </p>
          </div>
        </div>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
          vs {feature.opponentName} ({feature.opponentCode})
        </p>
      </div>

      {/* Glassmorphism meta panel — strong blur + extra opacity so the
          white type reads cleanly over any image. */}
      <div className="relative z-10 m-3 rounded-lg border border-white/20 bg-white/15 p-4 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-white">
          <span>{data.dateLabel}</span>
          {data.timeLabel ? <span>{data.timeLabel}</span> : <span className="text-white/55">TBD</span>}
        </div>

        <div className="mt-2 flex items-center justify-between text-[12px] text-white/90">
          <span className="truncate font-sans font-medium">{data.stadium}</span>
          <span className="ml-3 truncate font-sans">{data.city}</span>
        </div>
      </div>
    </Link>
  );
}
