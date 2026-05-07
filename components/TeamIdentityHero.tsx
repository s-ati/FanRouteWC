import Link from "next/link";
import { flagEmoji } from "@/lib/flags";
import Chip from "./Chip";
import TeamHeroBackground from "./TeamHeroBackground";

// Fallback hero for teams that don't have an upcoming SF fixture yet.
// Same visual shell as MatchHero (slideshow + dark overlay + chip)
// but renders the team name as the headline instead of a scoreline.

export type TeamIdentityHeroData = {
  code: string;                          // 3-letter FIFA code
  displayName: string;
  eyebrow?: string;                      // "Following" / etc.
  tagline?: string | null;               // body line under the headline
  backgroundImages?: string[];
  ctaLabel?: string;
  ctaHref?: string;
};

export default function TeamIdentityHero({ data }: { data: TeamIdentityHeroData }) {
  const hasSlideshow = !!data.backgroundImages?.length;

  return (
    <section
      className="relative flex w-full items-end overflow-hidden rounded-xl bg-surface-container p-container-padding md:aspect-[21/9]"
      style={{
        minHeight: "320px",
        aspectRatio: hasSlideshow ? undefined : "4/3",
      }}
    >
      {hasSlideshow ? (
        <TeamHeroBackground images={data.backgroundImages!} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <span
            aria-hidden
            className="select-none text-[280px] leading-none opacity-15 md:text-[420px]"
          >
            {flagEmoji(data.code) || "🏳️"}
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

      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

      <div className="relative z-10 flex w-full flex-col items-start justify-between gap-stack-lg md:flex-row md:items-end">
        <div className="space-y-stack-md text-white">
          {data.eyebrow ? (
            <Chip tone="primary" size="sm">
              {data.eyebrow}
            </Chip>
          ) : null}
          <h1 className="flex flex-wrap items-center gap-3 text-display-xl text-white drop-shadow-md">
            <span aria-hidden className="text-[0.7em]">
              {flagEmoji(data.code) || "🏳️"}
            </span>
            <span>{data.displayName}</span>
          </h1>
          {data.tagline ? (
            <p className="max-w-xl text-body-main text-white/85">
              {data.tagline}
            </p>
          ) : null}
        </div>

        {data.ctaHref ? (
          <Link
            href={data.ctaHref}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-body-main font-semibold text-on-primary shadow-ambient transition hover:bg-primary-container"
          >
            {data.ctaLabel || "Browse the schedule"}
            <span className="material-symbols-outlined" aria-hidden>
              arrow_forward
            </span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
