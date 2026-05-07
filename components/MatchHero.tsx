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
      ) : (
        // No team photo set yet — render a giant flag watermark + cyan
        // glow so the hero still has visual identity instead of an empty
        // navy box. Drop photos into public/images/teams/<slug>/ to
        // replace this fallback for the team.
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <span
            aria-hidden
            className="select-none text-[280px] leading-none opacity-15 md:text-[420px]"
          >
            {flagEmoji(data.homeCode) || "🏳️"}
          </span>
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -left-16 h-96 w-96 rounded-full opacity-50 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(0, 163, 224, 0.65), rgba(0, 163, 224, 0) 70%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(125, 211, 252, 0.55), rgba(125, 211, 252, 0) 70%)",
            }}
          />
        </div>
      )}

      {/* Bottom-only gradient — keeps the photo visible while giving the
          headline + countdown enough contrast to read at the bottom. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

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

          <h1 className="text-2xl font-extrabold leading-[1.05] text-white drop-shadow-md md:text-display-xl">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="text-[0.85em]">
                {flagEmoji(data.homeCode) || "🏳️"}
              </span>
              <span>{data.homeCode}</span>
            </span>
            <span className="mx-2 align-middle font-light text-white/70 md:mx-3">
              v
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="text-[0.85em]">
                {flagEmoji(data.awayCode) || "🏳️"}
              </span>
              <span>{data.awayCode}</span>
            </span>
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm font-semibold text-white md:text-headline-md">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="material-symbols-outlined"
                aria-hidden
                style={{ fontSize: "16px" }}
              >
                timer
              </span>
              {data.countdownText}
            </span>
            {data.hostStadium ? (
              <span className="inline-flex items-center gap-1.5 font-normal text-white/80">
                <span
                  className="material-symbols-outlined"
                  aria-hidden
                  style={{ fontSize: "16px" }}
                >
                  stadium
                </span>
                {data.hostStadium}
              </span>
            ) : null}
            {data.kickoffLocal ? (
              <span className="text-[12px] font-normal text-white/80 md:text-body-sm">
                {data.kickoffLocal}
              </span>
            ) : null}
          </div>
        </div>

        {data.ctaHref ? (
          <Link
            href={data.ctaHref}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-body-sm font-semibold text-on-primary shadow-ambient transition hover:bg-primary-container md:gap-2 md:rounded-lg md:px-5 md:py-3 md:text-body-main"
          >
            {data.ctaLabel || "Where to watch"}
            <span
              className="material-symbols-outlined"
              aria-hidden
              style={{ fontSize: "14px" }}
            >
              arrow_forward
            </span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
