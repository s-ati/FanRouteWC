import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import {
  getCountryByCode,
  getFanZonesByIds,
  getRankedBarsForCountry,
  type RankedBar,
} from "@/lib/queries";
import { COUNTRY_COOKIE, readPickedCountry } from "@/lib/country-cookie";
import { flagEmoji } from "@/lib/flags";
import { demonym } from "@/lib/demonyms";
import {
  SF_OFFICIAL_FAN_ZONES,
  getTeamByCode,
} from "@/lib/wc2026-teams";
import type { VenueWithRelations } from "@/lib/matchday";

export const revalidate = 60;

async function setCountryAction(formData: FormData) {
  "use server";
  const code = String(formData.get("country_code") ?? "")
    .trim()
    .toUpperCase();
  if (code.length === 3) {
    const store = await cookies();
    store.set(COUNTRY_COOKIE, code, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
  }
}

async function clearCountryAction() {
  "use server";
  const store = await cookies();
  store.delete(COUNTRY_COOKIE);
}

export default async function CountryDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  const team = getTeamByCode(upperCode);
  const country = await getCountryByCode(upperCode);
  if (!team && !country) notFound();

  const displayName = country?.name ?? team?.name ?? upperCode;

  const fanZoneIds = country?.fan_zones?.length
    ? country.fan_zones
    : SF_OFFICIAL_FAN_ZONES;

  const [bars, fanZones, picked] = await Promise.all([
    getRankedBarsForCountry(upperCode),
    getFanZonesByIds(fanZoneIds),
    readPickedCountry(),
  ]);

  const isPicked = picked === upperCode;
  const flag = flagEmoji(upperCode);
  const dem = demonym(upperCode);
  const barHeader = dem
    ? `FanRoute's ${dem.toLowerCase()}-fan bars`
    : `FanRoute's ${displayName} bars`;

  return (
    <main>
      {/* Hero ------------------------------------------------------------ */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <Link
            href="/onboarding"
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted hover:text-ink"
          >
            ← All countries
          </Link>
          <div className="mt-6 flex items-center gap-5">
            <span className="text-6xl leading-none md:text-7xl" aria-hidden>
              {flag || "🏳️"}
            </span>
            <h1
              className="font-display text-4xl font-semibold leading-[1.02] text-ink md:text-6xl"
              style={{ letterSpacing: "-0.035em" }}
            >
              {displayName}
            </h1>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3 text-sm">
            {isPicked ? (
              <form action={clearCountryAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md border border-rule-strong px-5 py-3 font-medium text-ink transition hover:-translate-y-[1px] hover:border-ink"
                >
                  ✓ Your country — clear
                </button>
              </form>
            ) : (
              <form action={setCountryAction}>
                <input type="hidden" name="country_code" value={upperCode} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-3 font-medium text-paper shadow-lift-1 transition hover:-translate-y-[1px] hover:bg-accent hover:shadow-lift-2"
                >
                  Make {displayName} my country →
                </button>
              </form>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md border border-rule-strong px-5 py-3 font-medium text-ink transition hover:-translate-y-[1px] hover:border-ink"
            >
              See the schedule
            </Link>
          </div>
        </div>
      </section>

      {/* Bars ------------------------------------------------------------ */}
      {bars.length ? (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2
            className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl"
            style={{ letterSpacing: "-0.025em" }}
          >
            {barHeader}
          </h2>
          <ol className="mt-10 divide-y divide-rule border-y border-rule">
            {bars.map((b) => (
              <li key={b.venue.id}>
                <BarRow bar={b} flagFallback={flag} />
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* Fan zones ------------------------------------------------------- */}
      {fanZones.length ? (
        <section
          className={
            bars.length
              ? "border-t border-rule bg-paper-deep/40"
              : "bg-paper-deep/40"
          }
        >
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2
              className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl"
              style={{ letterSpacing: "-0.025em" }}
            >
              Official SF fan zones
            </h2>
            <ul role="list" className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2">
              {fanZones.map((v) => (
                <li key={v.id}>
                  <FanZoneCard venue={v} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function BarRow({
  bar,
  flagFallback,
}: {
  bar: RankedBar;
  flagFallback: string;
}) {
  const { venue } = bar;
  return (
    <Link
      href={`/venues/${venue.id}`}
      className="group flex items-center justify-between gap-6 px-2 py-5 transition hover:bg-paper-deep/40"
    >
      <div className="flex items-center gap-4">
        <BarThumb
          src={venue.photo_url}
          alt={venue.name}
          flagFallback={flagFallback}
        />
        <div>
          <h3
            className="font-display text-2xl font-semibold tracking-tight text-ink group-hover:text-accent"
            style={{ letterSpacing: "-0.02em" }}
          >
            {venue.name}
          </h3>
          {venue.neighborhood ? (
            <p className="mt-1 text-sm text-ink-body">{venue.neighborhood}</p>
          ) : null}
        </div>
      </div>
      <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
        →
      </span>
    </Link>
  );
}

function BarThumb({
  src,
  alt,
  flagFallback,
}: {
  src: string | null;
  alt: string;
  flagFallback: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={160}
        height={160}
        sizes="80px"
        className="h-20 w-20 flex-none rounded-md border border-rule object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex h-20 w-20 flex-none items-center justify-center rounded-md border border-rule bg-paper-deep/60 text-3xl"
    >
      {flagFallback || "🏳️"}
    </span>
  );
}

function FanZoneCard({ venue }: { venue: VenueWithRelations }) {
  return (
    <Link
      href={`/venues/${venue.id}`}
      className="group block rounded-lg border border-rule bg-surface p-5 shadow-lift-1 transition hover:-translate-y-[1px] hover:border-ink hover:shadow-lift-2"
    >
      <h3 className="font-display text-2xl font-semibold tracking-tight text-ink group-hover:text-accent">
        {venue.name}
      </h3>
      <p className="mt-1 text-sm text-ink-body">{venue.address}</p>
    </Link>
  );
}
