import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-ink"
        >
          <span
            className="h-5 w-5 rounded-md shadow-lift-1"
            style={{
              background:
                "linear-gradient(140deg, #0B1A2C 0%, #0B1A2C 45%, #2B4DE8 45%, #2B4DE8 100%)",
            }}
            aria-hidden
          />
          <span className="font-display text-lg font-semibold tracking-tight">
            FanRoute
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-ink-body">
          <Link href="/#schedule" className="transition-colors hover:text-ink">
            Schedule
          </Link>
          <Link href="/#groups" className="transition-colors hover:text-ink">
            Groups
          </Link>
          <Link href="/#bracket" className="transition-colors hover:text-ink">
            Bracket
          </Link>
          <Link href="/#venues" className="transition-colors hover:text-ink">
            Venues
          </Link>
          <Link
            href="/onboarding"
            className="rounded-md border border-rule-strong px-3 py-1.5 transition-colors hover:border-ink hover:text-ink"
          >
            Pick country
          </Link>
          <span className="hidden font-mono text-[11px] uppercase tracking-widest text-ink-muted lg:inline">
            San Francisco · 2026
          </span>
        </nav>
      </div>
    </header>
  );
}
