import Link from "next/link";
import { flagEmoji } from "@/lib/flags";
import Chip from "./Chip";
import TeamHeroBackground from "./TeamHeroBackground";

export type MatchHeroData = {
  matchId: string;
  homeCode: string;
  awayCode: string;
  homeName?: string | null;
  awayName?: string | null;
  stage?: string | null;       // "GROUP A" / "ROUND OF 16" / etc.
  countdownText: string;       // "03:45:12" or "in 3 days"
  kickoffLocal?: string | null;
  hostStadium?: string | null; // "Levi's Stadium"
  backgroundUrl?: string | null;
  backgroundImages?: string[]; // when provided, renders a crossfade slideshow
  ctaLabel?: string;
  ctaHref?: string;
  eyebrow?: string;            // "NEXT MATCH" / "USA's next match"
};

// Big featured match card. Background (single image OR slideshow) + dark
// gradient + display-xl teams + countdown + CTA. Sits at the top of the
// personalized home.
export default function MatchHero({ data }: { data: MatchHeroData }) {
  const hasSlideshow =
    Array.isArray(data.backgroundImages) && data.backgroundImages.length > 0;
  const singleBg =
    !hasSlideshow && data.backgroundUrl
      ? { backgroundImage: `url(${data.backgroundUrl})` }
      : undefined;
  const hasAnyBg = hasSlideshow || !!singleBg;

  return (
    <section
      className="relative flex w-full items-end overflow-hidden rounded-xl bg-surface-container p-container-padding md:aspect-[21/9]"
      style={{
        ...singleBg,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: hasAnyBg ? undefined : "320px",
        aspectRatio: hasAnyBg ? undefined : "4/3",
      }}
    >
      {hasSlideshow ? (
        <TeamHeroBackground images={data.backgroundImages!} />
      ) : null}

      {/* dark overlay for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      <div className="relative z-10 flex w-full flex-col items-start justify-between gap-stack-lg md:flex-row md:items-end">
        <div className="space-y-stack-md text-white">
          <div className="flex flex-wrap items-center gap-2">
            {data.eyebrow ? (
              <Chip tone="primary" size="sm">
                {data.eyebrow}
              </Chip>
            ) : null}
            {data.stage ? (
              <span className="text-label-caps font-bold uppercase tracking-[0.05em] text-white/80">
                {data.stage}
              </span>
            ) : null}
          </div>

          <h1 className="text-display-xl text-white drop-shadow-md">
            <span className="inline-flex items-center gap-3">
              <span aria-hidden className="text-[0.7em]">
                {flagEmoji(data.homeCode) || "🏳️"}
              </span>
              <span>{data.homeCode}</span>
            </span>
            <span className="mx-3 align-middle font-light text-white/70">v</span>
            <span className="inline-flex items-center gap-3">
              <span aria-hidden className="text-[0.7em]">
                {flagEmoji(data.awayCode) || "🏳️"}
              </span>
              <span>{data.awayCode}</span>
            </span>
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-headline-md font-semibold text-white">
            <span className="inline-flex items-center gap-2">
              <span className="material-symbols-outlined" aria-hidden>
                timer
              </span>
              {data.countdownText}
            </span>
            {data.hostStadium ? (
              <span className="inline-flex items-center gap-2 text-body-main font-normal text-white/80">
                <span className="material-symbols-outlined" aria-hidden>
                  stadium
                </span>
                {data.hostStadium}
              </span>
            ) : null}
            {data.kickoffLocal ? (
              <span className="text-body-sm text-white/80">
                {data.kickoffLocal}
              </span>
            ) : null}
          </div>
        </div>

        {data.ctaHref ? (
          <Link
            href={data.ctaHref}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-body-main font-semibold text-on-primary shadow-ambient transition hover:bg-primary-container"
          >
            {data.ctaLabel || "Where to watch"}
            <span className="material-symbols-outlined" aria-hidden>
              arrow_forward
            </span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
