import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import TeamPicker from "@/components/TeamPicker";
import { COUNTRY_COOKIE, readPickedCountry } from "@/lib/country-cookie";
import { flagEmoji } from "@/lib/flags";

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

  return (
    <main className="mx-auto max-w-7xl px-container-padding py-section-gap">
      <section className="mb-section-gap">
        <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
          San Francisco · 2026
        </p>
        <h1 className="mt-stack-md text-display-xl text-on-surface">
          Pick your team
        </h1>
        <p className="mt-stack-md max-w-xl text-body-main text-on-surface-variant">
          FanRoute personalizes around the team you follow — your next match,
          standings, and the bars where the right crowd shows up.
        </p>
        {picked ? (
          <div className="mt-stack-lg inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-body-sm">
            <span aria-hidden className="text-base">
              {flagEmoji(picked) || "🏳️"}
            </span>
            <span className="text-on-surface-variant">Currently following</span>
            <span className="font-bold text-on-surface">{picked}</span>
            <Link
              href={`/country/${picked}`}
              className="ml-2 text-primary underline underline-offset-4"
            >
              view picks
            </Link>
          </div>
        ) : null}
      </section>

      <form action={pickCountryAction}>
        <TeamPicker pickedCode={picked} />
      </form>
    </main>
  );
}
