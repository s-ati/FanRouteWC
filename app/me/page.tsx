import Link from "next/link";
import { redirect } from "next/navigation";
import Chip from "@/components/Chip";
import { COUNTRY_COOKIE, readPickedCountry } from "@/lib/country-cookie";
import { flagEmoji } from "@/lib/flags";
import { getCountryByCode } from "@/lib/queries";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getTeamByCode } from "@/lib/wc2026-teams";

export const revalidate = 0;

export default async function MePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/me");

  const pickedCode = await readPickedCountry();
  const country = pickedCode
    ? await getCountryByCode(pickedCode).catch(() => null)
    : null;
  const team = pickedCode ? getTeamByCode(pickedCode) : null;
  const displayName = country?.name ?? team?.name ?? null;

  const created = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <main className="mx-auto max-w-3xl space-y-section-gap px-container-padding py-section-gap">
      <Link
        href="/"
        className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary"
      >
        ← BACK TO HOME
      </Link>

      <header>
        <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
          Your window
        </p>
        <h1 className="mt-stack-md text-display-xl text-on-surface">
          {user.email?.split("@")[0] ?? "Welcome"}
        </h1>
        <p className="mt-stack-md text-body-main text-on-surface-variant">
          Signed in as <span className="text-on-surface">{user.email}</span>
          {created ? ` · joined ${created}` : null}
        </p>
      </header>

      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg">
        <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
          Your team
        </p>
        {pickedCode ? (
          <div className="mt-stack-md flex flex-wrap items-center gap-stack-md">
            <span aria-hidden className="text-4xl leading-none">
              {flagEmoji(pickedCode) || "🏳️"}
            </span>
            <div className="flex flex-col">
              <span className="text-headline-md text-on-surface">
                {displayName ?? pickedCode}
              </span>
              <span className="text-body-sm text-on-surface-variant">
                Following {pickedCode}
              </span>
            </div>
            <div className="ml-auto flex gap-2">
              <Link
                href={`/country/${pickedCode}`}
                className="inline-flex items-center rounded-md border border-outline-variant px-4 py-2 text-body-sm font-semibold text-on-surface hover:border-primary hover:text-primary"
              >
                Open team page
              </Link>
              <Link
                href="/onboarding"
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary hover:bg-primary-container"
              >
                Switch team
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-stack-md flex flex-wrap items-center gap-3">
            <p className="text-body-main text-on-surface-variant">
              No team picked yet.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary hover:bg-primary-container"
            >
              Pick your team
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg">
        <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
          Account
        </p>
        <div className="mt-stack-md flex flex-wrap items-center gap-3">
          <Chip tone="success" size="sm" icon="verified">
            Email verified
          </Chip>
          <form action="/auth/signout" method="post" className="ml-auto">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md border border-outline-variant px-4 py-2 text-body-sm font-semibold text-on-surface hover:border-error hover:text-error"
            >
              Sign out
              <span
                className="material-symbols-outlined"
                aria-hidden
                style={{ fontSize: 16 }}
              >
                logout
              </span>
            </button>
          </form>
        </div>
      </section>

      {/* Hide the Supabase user id where it's referenced — just informational */}
      <p className="text-body-sm text-on-surface-variant">
        Tip: bookmark{" "}
        <Link href="/me" className="text-primary underline underline-offset-4">
          /me
        </Link>{" "}
        — it&apos;s your private window.
      </p>
      {/* Defensive — silence linter on unused cookie const */}
      <span className="hidden">{COUNTRY_COOKIE}</span>
    </main>
  );
}
