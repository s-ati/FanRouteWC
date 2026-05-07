import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { flagEmoji } from "@/lib/flags";
import { COUNTRY_COOKIE, readPickedCountry } from "@/lib/country-cookie";
import { WC_2026_TEAMS } from "@/lib/wc2026-teams";

export const revalidate = 60;

async function pickCountryAction(formData: FormData) {
  "use server";
  const code = String(formData.get("country_code") ?? "")
    .trim()
    .toUpperCase();
  if (code.length !== 3) return;
  const store = await cookies();
  store.set(COUNTRY_COOKIE, code, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
  redirect(`/country/${code}`);
}

export default async function OnboardingPage() {
  const picked = await readPickedCountry();
  const teams = [...WC_2026_TEAMS].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main>
      <section className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" />
            San Francisco · 2026
          </p>
          <h1
            className="mt-6 font-display text-5xl font-semibold leading-[1.02] text-ink md:text-7xl"
            style={{ letterSpacing: "-0.04em" }}
          >
            What&apos;s your country?
          </h1>
          {picked ? (
            <p className="mt-8 inline-block rounded-md border border-rule bg-surface px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink-muted">
              Currently set to {flagEmoji(picked)} {picked} —{" "}
              <Link
                href={`/country/${picked}`}
                className="underline underline-offset-4"
              >
                view picks
              </Link>
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <ul
          role="list"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        >
          {teams.map((t) => (
            <li key={t.code}>
              <form action={pickCountryAction}>
                <input type="hidden" name="country_code" value={t.code} />
                <button
                  type="submit"
                  className="group flex w-full flex-col items-center gap-3 rounded-lg border border-rule bg-surface p-5 text-center shadow-lift-1 transition hover:-translate-y-[1px] hover:border-ink hover:shadow-lift-2"
                >
                  <span className="text-4xl leading-none" aria-hidden>
                    {flagEmoji(t.code) || "🏳️"}
                  </span>
                  <span
                    className="font-display text-base font-semibold leading-tight tracking-tight text-ink group-hover:text-accent"
                    style={{ letterSpacing: "-0.01em" }}
                  >
                    {t.name}
                  </span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
