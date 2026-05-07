import type { CrowdConfidence } from "@/lib/matchday";

export type OccupancyColor = "green" | "orange" | "red";

// Maps the internal 5-level confidence to the consumer-facing 3-color system.
export function colorFromConfidence(c: CrowdConfidence | null): OccupancyColor {
  if (c === "filling_up") return "orange";
  if (c === "packed" || c === "full") return "red";
  return "green";
}

const COLOR_CLASS: Record<OccupancyColor, { dot: string; text: string; bg: string }> = {
  green: { dot: "bg-success", text: "text-success", bg: "bg-success-container" },
  orange: { dot: "bg-warning", text: "text-warning", bg: "bg-warning-container" },
  red: { dot: "bg-error", text: "text-error", bg: "bg-error-container" },
};

// Small status pill: colored dot + short label. Sits on bar cards and
// venue hero. Pair with `OccupancyNote` for the explanatory line.
export default function OccupancyBadge({
  color,
  label,
  size = "md",
}: {
  color: OccupancyColor;
  label: string;
  size?: "sm" | "md";
}) {
  const c = COLOR_CLASS[color];
  const padding = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";
  const textSize = size === "sm" ? "text-[11px]" : "text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.05em] ${c.bg} ${c.text} ${padding} ${textSize}`}
    >
      <span className={`block rounded-full ${c.dot} ${dotSize}`} aria-hidden />
      {label}
    </span>
  );
}
