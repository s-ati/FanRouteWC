import Link from "next/link";

// Section header with optional VIEW ALL link. Used at the top of every
// stacked content band on the personalized home (Upcoming, Standings, Bars).
export default function SectionHeader({
  title,
  eyebrow,
  href,
  cta = "VIEW ALL",
}: {
  title: string;
  eyebrow?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="mb-stack-lg flex items-end justify-between gap-gutter">
      <div>
        {eyebrow ? (
          <p className="mb-stack-sm text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-headline-lg text-on-surface">{title}</h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="text-label-caps font-bold uppercase tracking-[0.05em] text-primary hover:underline"
        >
          {cta}
        </Link>
      ) : null}
    </div>
  );
}
