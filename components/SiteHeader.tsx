import Link from "next/link";
import { cookies } from "next/headers";
import { COUNTRY_COOKIE } from "@/lib/country-cookie";
import { flagEmoji } from "@/lib/flags";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import HeaderNav, { type HeaderNavItem } from "./HeaderNav";

// Information is a direct link. Every other item reveals a small popover
// with the actual destination CTA before navigating.
const NAV: HeaderNavItem[] = [
  { label: "Standings", href: "/standings", popover: "View all standings" },
  { label: "Bracket", href: "/bracket", popover: "View full bracket" },
  { label: "Venues", href: "/venues", popover: "View all venues" },
  { label: "Bars", href: "/bars", popover: "View all bars" },
  { label: "Schedule", href: "/schedule", popover: "View full schedule" },
  { label: "Information", href: "/knowledge" },
];

export default async function SiteHeader() {
  const [store, user] = await Promise.all([
    cookies(),
    getCurrentUser().catch(() => null),
  ]);
  const picked = store.get(COUNTRY_COOKIE)?.value?.toUpperCase() ?? null;
  const pickedFlag = picked ? flagEmoji(picked) : null;
  const userInitial =
    user?.email?.[0]?.toUpperCase() ?? null;

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-outline-variant"
      style={{
        backgroundColor: "rgba(0, 23, 95, 0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-gutter px-container-padding py-4">
        {/* Brand — small gradient mark + Manrope ExtraBold wordmark */}
        <Link href="/" className="inline-flex items-center gap-2.5 text-on-surface">
          <span
            className="h-5 w-5 rounded-md"
            style={{
              background:
                "linear-gradient(140deg, #1d1a24 0%, #1d1a24 45%, #630ed4 45%, #630ed4 100%)",
            }}
            aria-hidden
          />
          <span className="font-display text-lg font-extrabold tracking-tight">
            FanRoute
          </span>
        </Link>

        {/* Center nav — desktop only. Direct links + popover items
            handled inside HeaderNav (client). */}
        <HeaderNav items={NAV} />

        {/* Right — team chip + user avatar / sign-in CTA */}
        <div className="flex items-center gap-stack-sm">
          {picked ? (
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-sm font-medium text-on-surface transition hover:border-primary hover:text-primary"
              title="Switch team"
            >
              <span aria-hidden className="text-base leading-none">
                {pickedFlag || "🏳️"}
              </span>
              <span>{picked}</span>
            </Link>
          ) : (
            <Link
              href="/onboarding"
              className="hidden items-center rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary transition hover:bg-primary-container md:inline-flex"
            >
              Pick your team
            </Link>
          )}

          {user ? (
            <Link
              href="/me"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant bg-surface-container-low text-body-sm font-bold text-on-surface transition hover:border-primary hover:text-primary"
              title={user.email ?? "Your window"}
            >
              {userInitial}
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center rounded-md border border-outline-variant px-3 py-1.5 text-body-sm font-medium text-on-surface transition hover:border-primary hover:text-primary"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
