import Link from "next/link";

// Mobile-only sticky bottom nav. Two destinations for v1; Report + Saved
// land in a later phase when there's actually content behind them.
const TABS = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Live", href: "/#live", icon: "sensors" },
];

export default function BottomNav() {
  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="fixed bottom-0 left-0 z-50 w-full border-t border-outline-variant bg-background/90 backdrop-blur-md md:hidden"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-around px-gutter py-base">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="flex flex-1 flex-col items-center justify-center gap-1 rounded-md p-2 text-on-surface-variant transition hover:bg-surface-container hover:text-primary"
          >
            <span className="material-symbols-outlined" aria-hidden>
              {t.icon}
            </span>
            <span className="text-label-caps font-bold">{t.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
