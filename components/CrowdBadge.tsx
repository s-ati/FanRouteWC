import { crowdLabel, type CrowdConfidence } from "@/lib/matchday";
import type { CrowdSource } from "@/lib/types";

type Source = CrowdSource | "rule_fallback";

type Props = {
  crowd: CrowdConfidence;
  className?: string;
  source?: Source;
  ageMin?: number | null;
  rawPct?: number | null;
};

// Visual confidence decay based on data age:
//   0-30 min  → opacity 1.0
//   30-60 min → opacity 0.7
//   60-90 min → opacity 0.5
//   90+       → opacity 0.4 (forecast-only territory)
//   null      → opacity 1.0 (rule-based or fresh user report w/o age)
function opacityFromAge(ageMin: number | null | undefined): string {
  if (ageMin == null) return "opacity-100";
  if (ageMin <= 30) return "opacity-100";
  if (ageMin <= 60) return "opacity-70";
  if (ageMin <= 90) return "opacity-50";
  return "opacity-40";
}

// When raw_pct is missing (rule-based fallback), use the center of the bucket
// so the bar still has something to render.
const BUCKET_DEFAULT_PCT: Record<CrowdConfidence, number> = {
  open: 15,
  room: 35,
  filling_up: 60,
  packed: 82,
  full: 95,
};

// Color the fill based on busyness band:
//   0-50  → green   (room to spare)
//   50-80 → amber   (filling)
//   80+   → red     (packed/full)
function fillColor(pct: number): string {
  if (pct < 50) return "bg-official";
  if (pct < 80) return "bg-amber";
  return "bg-full-red";
}

export function sourceLabel(
  source: Source | undefined,
  ageMin: number | null | undefined,
): string | null {
  if (!source) return null;
  switch (source) {
    case "admin_override":
      return null;
    case "user_report":
      return "Based on fan reports";
    case "serpapi_live":
    case "outscraper_live":
      if (ageMin != null && ageMin > 60) {
        return `Live data, ${ageMin} min ago — likely still busy`;
      }
      return "Live data";
    case "serpapi_forecast":
    case "outscraper_forecast":
      return "Based on usual busyness";
    case "rule_fallback":
      return "Estimated from venue type";
    default:
      return null;
  }
}

export default function CrowdBadge({
  crowd,
  className = "",
  source,
  ageMin,
  rawPct,
}: Props) {
  const opacity = opacityFromAge(ageMin);
  const pct =
    typeof rawPct === "number"
      ? Math.max(0, Math.min(100, rawPct))
      : BUCKET_DEFAULT_PCT[crowd];
  const color = fillColor(pct);

  return (
    <span
      className={`inline-flex flex-col items-start gap-1 ${opacity} ${className}`}
    >
      <span
        className="relative block h-1.5 w-24 overflow-hidden rounded-full bg-rule"
        role="img"
        aria-label={`${crowdLabel(crowd)} — ${pct}% busy`}
      >
        <span
          className={`block h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="font-mono text-[11px] uppercase tracking-widest text-ink-body">
        {crowdLabel(crowd)}
      </span>
    </span>
  );
}
