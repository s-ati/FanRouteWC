// "Venue Pulse" — glassmorphism dashboard surfacing the venue's atmosphere
// signals as visual gauges instead of plain text. Renders on a deep
// gradient bed so the bg-white/10 + backdrop-blur cards actually read as
// frosted glass.
//
// Props are pre-shaped (not generic cells) so the gauges have everything
// they need without callers stuffing strings into a value field.

import {
  Volume2,
  Users,
  Utensils,
  Home as HomeIcon,
  Activity,
  type LucideIcon,
} from "lucide-react";

export type AtmosphereCell = {
  icon: string;
  label: string;
  value: string;
};

export type VenuePulseData = {
  setting: string;                                     // "indoor" / "outdoor" / "mixed"
  vibe: string | null;                                 // raw vibe label
  soundLikelihood: "high" | "medium" | "low" | null;
  capacityMax: number | null;
  capacityCurrentPct: number | null;                   // 0..100, current load
  foodAvailable: boolean | null;
};

const GRADIENT_ID = "venuePulseGradient";

// Map vibe → 0..1 energy. Drives the gauge needle position.
//   family    → 0.20 (chill)
//   mixed     → 0.50 (middle of the dial)
//   hardcore  → 0.65
//   party     → 0.80 (per spec — leaves headroom past the needle)
function vibeIntensity(vibe: string | null): number {
  if (!vibe) return 0.4;
  switch (vibe.toLowerCase()) {
    case "party":
      return 0.8;
    case "hardcore":
      return 0.65;
    case "mixed":
      return 0.5;
    case "family":
      return 0.2;
    default:
      return 0.4;
  }
}

// Capacity-load trend copy. Replaces the "TBD" line under the bar.
function capacityTrend(pct: number | null): string {
  if (pct == null) return "Trend pending";
  if (pct < 50) return "Easy entry now";
  if (pct > 80) return "Standing room only";
  return "Filling up steadily";
}

function soundLevel(s: VenuePulseData["soundLikelihood"]): number {
  if (s === "high") return 5;
  if (s === "medium") return 3;
  if (s === "low") return 1;
  return 0;
}

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

// Backwards-compat: accept the old generic-cells API so existing callers
// keep compiling. Parses cells back into structured data.
type LegacyProps = { cells: AtmosphereCell[] };
type Props = { data: VenuePulseData } | LegacyProps;

function legacyToData(cells: AtmosphereCell[]): VenuePulseData {
  const get = (label: string) =>
    cells.find((c) => c.label.toLowerCase() === label.toLowerCase())?.value ??
    "TBD";
  const setting = get("Setting").toLowerCase();
  const vibe = get("Vibe");
  const soundRaw = get("Sound").toLowerCase();
  const sound: VenuePulseData["soundLikelihood"] =
    soundRaw === "high" || soundRaw === "medium" || soundRaw === "low"
      ? soundRaw
      : null;
  const capRaw = get("Capacity").replace(/,/g, "");
  const capacityMax = /^\d+$/.test(capRaw) ? Number(capRaw) : null;
  const food = get("Food");
  return {
    setting,
    vibe: vibe === "TBD" ? null : vibe,
    soundLikelihood: sound,
    capacityMax,
    capacityCurrentPct: null,
    foodAvailable: food === "Yes" ? true : food === "No" ? false : null,
  };
}

export default function AtmosphereGrid(props: Props) {
  const data: VenuePulseData =
    "data" in props ? props.data : legacyToData(props.cells);

  return (
    <div className="relative isolate overflow-hidden rounded-xl bg-[#00175F] p-stack-lg">
      {/* Cyan glow blobs so the navy bg has depth and the glass cards feel
          refractive against the FIFA palette. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(0, 163, 224, 0.55), rgba(0, 163, 224, 0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-10 h-80 w-80 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(125, 211, 252, 0.5), rgba(125, 211, 252, 0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(0, 196, 255, 0.45), rgba(0, 196, 255, 0) 70%)",
        }}
      />

      {/* Single SVG <defs> for the cyan gradient stroke shared by every
          Lucide icon. */}
      <svg
        width="0"
        height="0"
        aria-hidden
        className="absolute"
        style={{ position: "absolute" }}
      >
        <defs>
          <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="100%" stopColor="#00A3E0" />
          </linearGradient>
          <linearGradient id={`${GRADIENT_ID}-fill`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="100%" stopColor="#00A3E0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative grid grid-cols-2 gap-4 md:grid-cols-5">
        <GlassCard label="Setting" Icon={HomeIcon}>
          <p className="font-mono text-headline-md text-white">
            {cap(data.setting)}
          </p>
        </GlassCard>

        <GlassCard label="Vibe" Icon={Activity}>
          <VibeMeter intensity={vibeIntensity(data.vibe)} />
          <p className="mt-1 font-mono text-body-sm text-white/80">
            {data.vibe ? cap(data.vibe) : "—"}
          </p>
        </GlassCard>

        <GlassCard label="Sound" Icon={Volume2}>
          <SoundBars level={soundLevel(data.soundLikelihood)} />
          <p className="mt-1 font-mono text-body-sm text-white/80">
            {data.soundLikelihood ? cap(data.soundLikelihood) : "—"}
          </p>
        </GlassCard>

        <GlassCard label="Capacity" Icon={Users}>
          <CapacityBar
            currentPct={data.capacityCurrentPct}
            max={data.capacityMax}
          />
          <p className="mt-2 font-mono text-body-sm text-white/80">
            {capacityTrend(data.capacityCurrentPct)}
          </p>
        </GlassCard>

        {/* Food spans 2 cols on mobile (so the 2x3 grid has a clean
            full-width bottom row); single col on desktop. */}
        <GlassCard
          label="Food"
          Icon={Utensils}
          className="col-span-2 md:col-span-1"
        >
          <p className="font-mono text-headline-md text-white">
            {data.foodAvailable === true
              ? "Yes"
              : data.foodAvailable === false
                ? "No"
                : "—"}
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

// ── Card shell ────────────────────────────────────────────────────────────
// Icons sit absolute in the top-right at 16px / opacity-40 so they read as
// glyphs, not focal elements. Card content is text-centered on mobile,
// left-aligned on desktop where the 5-col rhythm wants tighter alignment.
function GlassCard({
  label,
  Icon,
  children,
  className = "",
}: {
  label: string;
  Icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex flex-col items-center gap-stack-sm rounded-lg border border-[rgba(0,163,224,0.2)] bg-[rgba(5,30,117,0.55)] p-stack-md text-center backdrop-blur-md md:items-stretch md:text-left ${className}`}
      style={{
        boxShadow: "0 0 24px -6px rgba(0, 163, 224, 0.25)",
      }}
    >
      <Icon
        size={16}
        strokeWidth={2}
        stroke={`url(#${GRADIENT_ID})`}
        fill="none"
        className="absolute right-3 top-3 opacity-40"
      />
      <span className="text-label-caps font-bold uppercase tracking-[0.08em] text-white/70">
        {label}
      </span>
      {children}
    </div>
  );
}

// ── Sound: 5 vertical bars ────────────────────────────────────────────────
function SoundBars({ level }: { level: number }) {
  const bars = [0, 1, 2, 3, 4];
  return (
    <div className="flex h-8 items-end gap-1">
      {bars.map((i) => {
        const h = 30 + i * 14;
        const filled = i < level;
        return (
          <span
            key={i}
            className={`w-2 rounded-sm transition-all ${
              filled ? "bg-[#00A3E0]" : "bg-[rgba(0,23,95,0.7)]"
            }`}
            style={{
              height: `${h}%`,
              boxShadow: filled
                ? "0 0 8px rgba(0, 163, 224, 0.6)"
                : undefined,
            }}
            aria-hidden
          />
        );
      })}
    </div>
  );
}

// ── Vibe: half-circle gauge with a needle ─────────────────────────────────
function VibeMeter({ intensity }: { intensity: number }) {
  const angle = -90 + Math.max(0, Math.min(1, intensity)) * 180;
  return (
    <svg
      viewBox="0 0 100 56"
      className="h-12 w-full"
      aria-hidden
      style={{ filter: "drop-shadow(0 0 6px rgba(0, 163, 224, 0.45))" }}
    >
      {/* Track — deep navy */}
      <path
        d="M10 50 A40 40 0 0 1 90 50"
        fill="none"
        stroke="rgba(0, 23, 95, 0.85)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Filled portion — cyan gradient */}
      <path
        d="M10 50 A40 40 0 0 1 90 50"
        fill="none"
        stroke={`url(#${GRADIENT_ID}-fill)`}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${Math.PI * 40 * intensity}, 999`}
      />
      {/* Needle */}
      <g transform={`rotate(${angle} 50 50)`}>
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="14"
          stroke="#F1F5F9"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="50" cy="50" r="3" fill="#F1F5F9" />
      </g>
    </svg>
  );
}

// ── Capacity: green/yellow/red horizontal bar ─────────────────────────────
// Same green→yellow→red tone bands as the venue page's "Right now" bar so
// the two surfaces stay visually consistent.
function CapacityBar({
  currentPct,
  max: _max,
}: {
  currentPct: number | null;
  max: number | null;
}) {
  void _max;
  const pct = currentPct == null ? 0 : Math.max(0, Math.min(100, currentPct));
  const fill =
    pct >= 70
      ? "bg-rose-500"
      : pct >= 40
        ? "bg-amber-500"
        : pct > 0
          ? "bg-emerald-500"
          : "bg-white/30";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-headline-md text-white">
          {currentPct == null ? "—" : `${Math.round(pct)}%`}
        </span>
        <span className="text-label-caps font-bold uppercase tracking-[0.08em] text-white/60">
          load
        </span>
      </div>
      <div
        className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[rgba(0,23,95,0.85)]"
        style={{ boxShadow: "0 0 12px rgba(0, 163, 224, 0.35)" }}
      >
        <div
          className={`h-full rounded-full transition-all ${fill}`}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
