import Link from "next/link";

// Compact subhero tile. Sits below the main MatchHero on the home page —
// quick entry points to dedicated landing pages (Venues, Schedule, etc.).
// Layout: icon top-left, arrow top-right, eyebrow + title bottom.
// All tiles use the same min-height so a 4-up row stays perfectly aligned.

export default function HeroTile({
  href,
  eyebrow,
  title,
  icon,
  accent = "primary",
}: {
  href: string;
  eyebrow: string;
  title: string;
  /** Legacy — no longer rendered; kept so existing call sites compile */
  cta?: string;
  icon?: string;
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
      className={`group relative flex h-full min-h-[124px] flex-col justify-between gap-stack-md overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg transition hover:-translate-y-[1px] hover:shadow-ambient ${ring}`}
    >
      {/* Top row — icon left, arrow right */}
      <div className="flex items-start justify-between">
        {icon ? (
          <span
            aria-hidden
            className="flex h-9 w-9 flex-none items-center justify-center rounded-md"
            style={{
              background: `${dotColor}1A`, // 10% tint
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
        ) : (
          <span className="h-9 w-9" aria-hidden />
        )}
        <span
          aria-hidden
          className="material-symbols-outlined text-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
          style={{ fontSize: 20 }}
        >
          arrow_outward
        </span>
      </div>

      {/* Bottom — eyebrow + title stacked */}
      <div className="min-w-0">
        <p className="whitespace-nowrap font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
          {eyebrow}
        </p>
        <p className="mt-1 text-headline-md leading-tight text-on-surface group-hover:text-primary">
          {title}
        </p>
      </div>
    </Link>
  );
}
