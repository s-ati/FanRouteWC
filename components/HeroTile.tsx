import Link from "next/link";

// Compact subhero tile. Sits below the main MatchHero on the home page —
// quick entry points to dedicated landing pages (Venues, Schedule,
// General Knowledge). The site header keeps the primary "main heros"
// (Standings, Bracket, Venues, Bars, Schedule) — these are smaller cards.

export default function HeroTile({
  href,
  eyebrow,
  title,
  cta,
  icon,
  accent = "primary",
}: {
  href: string;
  eyebrow: string;
  title: string;
  cta: string;
  icon?: string;            // material-symbols-outlined name
  accent?: "primary" | "amber" | "emerald";
  /** Optional, currently unused — kept for API compat with earlier callers */
  description?: string;
}) {
  const ring =
    accent === "amber"
      ? "hover:border-amber"
      : accent === "emerald"
        ? "hover:border-success"
        : "hover:border-primary";
  const dotColor =
    accent === "amber"
      ? "#FFCE00"
      : accent === "emerald"
        ? "#10B981"
        : "#00A3E0";

  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-stack-md overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest px-stack-lg py-stack-md transition hover:-translate-y-[1px] hover:shadow-ambient ${ring}`}
    >
      {icon ? (
        <span
          aria-hidden
          className="flex h-9 w-9 flex-none items-center justify-center rounded-md"
          style={{
            background: `${dotColor}1A`,        // 10% tint
            boxShadow: `inset 0 0 0 1px ${dotColor}33`,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: dotColor }}
          >
            {icon}
          </span>
        </span>
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
          {eyebrow}
        </p>
        <p className="truncate text-headline-md text-on-surface group-hover:text-primary">
          {title}
        </p>
      </div>

      <span className="hidden items-center gap-1 text-label-caps font-bold uppercase tracking-[0.08em] text-primary md:inline-flex">
        <span>{cta}</span>
        <span
          className="material-symbols-outlined transition-transform group-hover:translate-x-1"
          aria-hidden
          style={{ fontSize: 16 }}
        >
          arrow_forward
        </span>
      </span>
      <span
        className="material-symbols-outlined text-on-surface-variant md:hidden"
        aria-hidden
        style={{ fontSize: 18 }}
      >
        chevron_right
      </span>
    </Link>
  );
}
