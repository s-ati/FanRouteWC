// Horizontal occupancy bar — fills proportionally to "current load" and
// flips color across 3 bands:
//   green   < 40%  (plenty of room)
//   yellow  40–70% (filling up)
//   red     ≥ 70%  (tight to full)
//
// Use as the visual on the venue's "Right now" section and as the
// Capacity gauge in the Venue Pulse dashboard.

import type { CrowdConfidence } from "@/lib/matchday";

export type OccupancyTone = "green" | "yellow" | "red" | "neutral";

// Map the existing 5-level CrowdConfidence to a representative %-of-capacity.
export function pctFromConfidence(c: CrowdConfidence | null | undefined): number {
  if (!c) return 0;
  switch (c) {
    case "open":
      return 15;
    case "room":
      return 35;
    case "filling_up":
      return 60;
    case "packed":
      return 85;
    case "full":
      return 100;
  }
}

export function toneFromPct(pct: number): OccupancyTone {
  if (pct >= 70) return "red";
  if (pct >= 40) return "yellow";
  if (pct > 0) return "green";
  return "neutral";
}

const TRACK: Record<OccupancyTone, string> = {
  green: "bg-emerald-500/15",
  yellow: "bg-amber-500/15",
  red: "bg-rose-500/15",
  neutral: "bg-on-surface-variant/10",
};
const FILL: Record<OccupancyTone, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-rose-500",
  neutral: "bg-on-surface-variant/40",
};
const TEXT: Record<OccupancyTone, string> = {
  green: "text-emerald-700",
  yellow: "text-amber-700",
  red: "text-rose-700",
  neutral: "text-on-surface-variant",
};

export default function OccupancyBar({
  pct,
  label,
  size = "md",
  showPct = true,
  variant = "light",
}: {
  pct: number;          // 0..100
  label: string;        // human caption ("Filling up fast")
  size?: "sm" | "md" | "lg";
  showPct?: boolean;
  variant?: "light" | "dark";
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const tone = toneFromPct(clamped);
  const heightClass =
    size === "lg" ? "h-3" : size === "sm" ? "h-1.5" : "h-2";
  const isDark = variant === "dark";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p
          className={`text-body-sm font-semibold ${
            isDark ? "text-white" : TEXT[tone]
          }`}
        >
          {label}
        </p>
        {showPct ? (
          <p
            className={`font-mono text-body-sm ${
              isDark ? "text-white/80" : "text-on-surface-variant"
            }`}
          >
            {Math.round(clamped)}%
          </p>
        ) : null}
      </div>
      <div
        className={`mt-1 w-full overflow-hidden rounded-full ${
          isDark ? "bg-white/10" : TRACK[tone]
        } ${heightClass}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${FILL[tone]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
