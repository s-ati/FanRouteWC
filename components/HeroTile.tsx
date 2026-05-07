import Link from "next/link";

// Click-into-detail hero tile. Big surface, small CTA, navigates to a
// dedicated landing page. Used for Venues / Schedule / General Knowledge
// entry points on the home page.

export default function HeroTile({
  href,
  eyebrow,
  title,
  description,
  cta,
  icon,
  accent = "primary",
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  icon?: string;            // material-symbols-outlined name
  accent?: "primary" | "amber" | "emerald";
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
      className={`group relative flex h-full flex-col justify-between gap-stack-lg overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg transition hover:-translate-y-[2px] hover:shadow-ambient-strong ${ring}`}
    >
      <span
        aria-hidden
        className="absolute right-stack-md top-stack-md inline-block h-2 w-2 rounded-full"
        style={{
          background: dotColor,
          boxShadow: `0 0 12px ${dotColor}`,
        }}
      />

      <div className="space-y-stack-md">
        <p className="text-label-caps font-bold uppercase tracking-[0.08em] text-on-surface-variant">
          {eyebrow}
        </p>
        <div className="flex items-start gap-3">
          {icon ? (
            <span
              className="material-symbols-outlined text-on-surface"
              aria-hidden
              style={{ fontSize: 28 }}
            >
              {icon}
            </span>
          ) : null}
          <h3 className="text-headline-lg text-on-surface">{title}</h3>
        </div>
        <p className="text-body-main text-on-surface-variant">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-2 text-label-caps font-bold uppercase tracking-[0.08em] text-primary">
        <span>{cta}</span>
        <span
          className="material-symbols-outlined transition-transform group-hover:translate-x-1"
          aria-hidden
          style={{ fontSize: 18 }}
        >
          arrow_forward
        </span>
      </div>
    </Link>
  );
}
