import Image from "next/image";
import Link from "next/link";
import OccupancyBadge from "./OccupancyBadge";
import Chip from "./Chip";
import type { OccupancyVerdict } from "@/lib/crowd/occupancy-copy";

export type BarCardData = {
  id: string;
  name: string;
  neighborhood: string | null;
  address: string | null;
  photoUrl: string | null;
  isOfficial: boolean;       // true for bar_country_affinity.role === 'home_bar'
  teamLabel?: string | null; // e.g. "GERMANY" — shows the country this bar serves
  walkingTime?: string | null; // optional pre-computed text like "8 min walk"
  occupancy?: OccupancyVerdict | null;
};

// The redesigned bar card — image LEFT, content RIGHT.
// Two density variants:
//   featured: large image (h-44 / md:h-56), more breathing room
//   compact:  smaller image (h-28), tighter padding, used in dense lists
export default function BarCard({
  bar,
  variant = "featured",
  flagFallback,
}: {
  bar: BarCardData;
  variant?: "featured" | "compact";
  flagFallback?: string;
}) {
  const isCompact = variant === "compact";
  const imageHeight = isCompact ? "h-28" : "h-40 md:h-44";
  const imageWidth = isCompact ? "md:w-44" : "md:w-72";

  return (
    <Link
      href={`/venues/${bar.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest transition hover:-translate-y-[1px] hover:border-primary hover:shadow-ambient md:flex-row"
    >
      {/* Image */}
      <div
        className={`relative flex-none overflow-hidden bg-surface-container ${imageHeight} ${imageWidth}`}
      >
        {bar.photoUrl ? (
          <Image
            src={bar.photoUrl}
            alt={bar.name}
            width={isCompact ? 320 : 600}
            height={isCompact ? 200 : 400}
            sizes={isCompact ? "176px" : "(max-width: 768px) 100vw, 288px"}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-full w-full items-center justify-center text-5xl"
          >
            {flagFallback || "🏳️"}
          </span>
        )}
        <div className="absolute left-stack-md top-stack-md">
          {bar.isOfficial ? (
            <Chip tone="primary" size="sm" icon="verified">
              Fans
            </Chip>
          ) : (
            <Chip tone="neutral" size="sm">
              Bar
            </Chip>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between gap-stack-md p-stack-lg">
        <div>
          <div className="mb-stack-sm flex flex-wrap items-center gap-2">
            {bar.teamLabel ? (
              <span className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
                {bar.teamLabel} fans
              </span>
            ) : null}
          </div>
          <h3 className="text-headline-md text-on-surface group-hover:text-primary">
            {bar.name}
          </h3>
          {bar.neighborhood || bar.walkingTime ? (
            <div className="mt-stack-sm flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-on-surface-variant">
              {bar.neighborhood ? (
                <span className="inline-flex items-center gap-1">
                  <span
                    className="material-symbols-outlined"
                    aria-hidden
                    style={{ fontSize: "16px" }}
                  >
                    place
                  </span>
                  {bar.neighborhood}
                </span>
              ) : null}
              {bar.walkingTime ? (
                <span className="inline-flex items-center gap-1">
                  <span
                    className="material-symbols-outlined"
                    aria-hidden
                    style={{ fontSize: "16px" }}
                  >
                    directions_walk
                  </span>
                  {bar.walkingTime}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {bar.occupancy ? (
          <div className="flex flex-wrap items-center gap-3">
            <OccupancyBadge
              color={bar.occupancy.color}
              label={bar.occupancy.label}
              size="sm"
            />
            <span className="text-body-sm text-on-surface-variant">
              {bar.occupancy.note}
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
