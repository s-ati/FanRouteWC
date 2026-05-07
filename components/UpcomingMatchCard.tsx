import Link from "next/link";
import { flagEmoji } from "@/lib/flags";
import type { MatchCardData } from "@/lib/wc2026-matches";

// "Architecture & Anthem" match card.
//   - Stadium architecture as the background image
//   - Dark purple/lavender → black gradient overlay
//   - Glassmorphism panel (backdrop-filter: blur) on the text container
//   - Hover: image scales up, overlay brightens to highlight team colors
//
// MatchCardData (lib/wc2026-matches.ts) is the canonical prop shape.

export type UpcomingMatchData = MatchCardData;

export default function UpcomingMatchCard({ data }: { data: MatchCardData }) {
  return (
    <Link
      href={`/matches/${data.matchId}`}
      className="group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-xl border border-outline-variant bg-black text-white shadow-ambient transition hover:-translate-y-[2px] hover:border-primary hover:shadow-lg"
    >
      {/* Background image — zooms on hover */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        style={{ backgroundImage: `url(${data.backgroundUrl})` }}
      />

      {/* Purple/lavender → black gradient overlay; brightens on hover */}
      <div
        aria-hidden
        className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-90"
        style={{
          background:
            "linear-gradient(to right, rgba(109, 40, 217, 0.8), rgba(0, 0, 0, 0.4))",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
      />

      {/* Top: group chip */}
      <div className="relative z-10 flex items-start justify-between p-4">
        {data.group ? (
          <span
            className="rounded-full border border-white/30 bg-white/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md"
            style={{ backdropFilter: "blur(8px)" }}
          >
            {data.group}
          </span>
        ) : (
          <span />
        )}
        {data.isBayArea ? (
          <span
            className="rounded-full border border-white/30 bg-white/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur-md"
            style={{ backdropFilter: "blur(8px)" }}
          >
            Bay Area
          </span>
        ) : null}
      </div>

      {/* Bottom: glassmorphism panel with teams + meta */}
      <div
        className="relative z-10 m-3 rounded-lg border border-white/15 bg-white/10 p-4"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      >
        <div className="flex items-center justify-between font-bold leading-none">
          <span className="inline-flex items-center gap-2 text-2xl tracking-tight">
            <span aria-hidden className="text-2xl">
              {flagEmoji(data.homeCode) || "🏳️"}
            </span>
            <span className="font-sans">{data.homeCode}</span>
          </span>
          <span className="font-mono text-xs font-medium uppercase tracking-[0.15em] text-white/70">
            vs
          </span>
          <span className="inline-flex items-center gap-2 text-2xl tracking-tight">
            <span className="font-sans">{data.awayCode}</span>
            <span aria-hidden className="text-2xl">
              {flagEmoji(data.awayCode) || "🏳️"}
            </span>
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-white/85">
          <span>{data.dateLabel}</span>
          <span>{data.timeLabel}</span>
        </div>

        <div className="mt-2 flex items-center justify-between text-[12px] text-white/80">
          <span className="truncate font-sans font-medium">{data.stadium}</span>
          <span className="ml-3 truncate font-sans">{data.city}</span>
        </div>
      </div>
    </Link>
  );
}
