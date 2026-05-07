import Link from "next/link";
import VenueMapLazy from "@/components/VenueMapLazy";
import MatchTicket from "@/components/MatchTicket";
import GroupCard from "@/components/GroupCard";
import KnockoutBracket from "@/components/KnockoutBracket";
import {
  getAllFixtures,
  getAllVenues,
  getCountryByCode,
  getUpcomingFixtures,
} from "@/lib/queries";
import type { Fixture } from "@/lib/types";
import {
  fixtureLabel,
  formatKickoffLocal,
  kickoffCountdown,
  matchCode,
} from "@/lib/matchday";
import { buildGroupSummaries } from "@/lib/groups";
import { readPickedCountry } from "@/lib/country-cookie";
import { flagEmoji } from "@/lib/flags";

export const revalidate = 60;

type HomeData = {
  venues: Awaited<ReturnType<typeof getAllVenues>>;
  upcoming: Fixture[];
  allFixtures: Fixture[];
  errorMessage: string | null;
};

async function loadHomeData(): Promise<HomeData> {
  try {
    const [venues, upcoming, allFixtures] = await Promise.all([
      getAllVenues(),
      getUpcomingFixtures("san-francisco", 6),
      getAllFixtures(),
    ]);
    return { venues, upcoming, allFixtures, errorMessage: null };
  } catch (err) {
    return {
      venues: [],
      upcoming: [],
      allFixtures: [],
      errorMessage:
        err instanceof Error ? err.message : "Failed to load data from Supabase.",
    };
  }
}

export default async function HomePage() {
  const { venues, upcoming, allFixtures, errorMessage } = await loadHomeData();
  const next = upcoming[0];
  const rest = upcoming.slice(1, 5);
  const groups = buildGroupSummaries(allFixtures);
  const pickedCode = await readPickedCountry();
  const pickedCountry = pickedCode ? await getCountryByCode(pickedCode).catch(() => null) : null;

  return (
    <main>
      {/* ============================================================ HERO */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" />
            San Francisco · 2026 · Matchday
          </p>
          <h1
            className="mt-6 font-display text-5xl font-semibold leading-[1.02] text-ink md:text-7xl"
            style={{ letterSpacing: "-0.04em" }}
          >
            The official place
            <br />
            to watch <em>the match</em>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-body">
            Pick a fixture and see the official fan zones ranked for it, the
            expected crowd, and the nearest fallback — before you leave the
            house.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3 text-sm">
            {pickedCountry ? (
              <Link
                href={`/country/${pickedCountry.country_code}`}
                className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-3 font-medium text-paper shadow-lift-1 transition hover:-translate-y-[1px] hover:bg-accent hover:shadow-lift-2"
              >
                <span aria-hidden>{flagEmoji(pickedCountry.country_code)}</span>
                Your spots for {pickedCountry.name} →
              </Link>
            ) : (
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-3 font-medium text-paper shadow-lift-1 transition hover:-translate-y-[1px] hover:bg-accent hover:shadow-lift-2"
              >
                What&apos;s your country? →
              </Link>
            )}
            <Link
              href="#schedule"
              className="inline-flex items-center gap-2 rounded-md border border-rule-strong px-5 py-3 font-medium text-ink transition hover:-translate-y-[1px] hover:border-ink"
            >
              Browse the schedule
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================= ERROR */}
      {errorMessage ? (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-lg border border-rule bg-surface p-6 shadow-lift-1">
            <p className="font-mono text-xs uppercase tracking-wide text-warm">
              Supabase error
            </p>
            <p className="mt-2 text-ink-body">{errorMessage}</p>
            <p className="mt-4 text-sm text-ink-muted">
              Check that <code>.env.local</code> has the Supabase URL + anon
              key and that <code>npm run seed</code> has been executed.
            </p>
          </div>
        </section>
      ) : null}

      {/* ======================================================= NEXT UP */}
      {next ? (
        <section className="mx-auto max-w-6xl px-6 py-24" id="next">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            Next up · {matchCode(next)}
          </p>
          <div className="mt-6 grid grid-cols-1 items-start gap-10 md:grid-cols-[1.1fr_1fr]">
            <div>
              <h2
                className="font-display text-5xl font-semibold leading-[1.02] text-ink md:text-6xl"
                style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.035em" }}
              >
                {fixtureLabel(next)}
              </h2>
              <p className="mt-4 font-mono text-sm uppercase tracking-wide text-ink-body">
                {formatKickoffLocal(next)} · kickoff {kickoffCountdown(next)}
              </p>
              <p className="mt-6 max-w-xl text-ink-body">
                {next.notes ??
                  "Official watch parties open across the city. Pick your spot before kickoff."}
              </p>
              <Link
                href={`/matches/${next.match_id}`}
                className="mt-8 inline-flex items-center gap-2 rounded-md border border-rule-strong px-5 py-3 text-sm font-medium text-ink transition hover:-translate-y-[1px] hover:border-ink"
              >
                Where to watch this match →
              </Link>
            </div>
            <div>
              <VenueMapLazy
                markers={venues.map((v) => ({
                  id: v.id,
                  name: v.name,
                  lat: v.lat,
                  lng: v.lng,
                  tier: v.relevance_level,
                  href: `/venues/${v.id}`,
                  subtitle: v.address,
                }))}
              />
              <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                {venues.length} official venues tracked in San Francisco
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* =================================================== UPCOMING STRIP */}
      {rest.length ? (
        <section
          id="schedule"
          className="border-y border-rule bg-paper-deep/60 py-20"
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                  Upcoming matchdays
                </p>
                <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                  Know where you&apos;re going,{" "}
                  <em className="font-semibold">before you go.</em>
                </h2>
              </div>
              <Link
                href="#groups"
                className="hidden font-mono text-[11px] uppercase tracking-widest text-ink-muted underline underline-offset-4 transition hover:text-ink md:inline"
              >
                Jump to groups →
              </Link>
            </div>
            <ul
              role="list"
              className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {rest.map((f) => (
                <li key={f.match_id}>
                  <MatchTicket fixture={f} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* =========================================================== GROUPS */}
      <section id="groups" className="mx-auto max-w-6xl px-6 py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              Group stage · 2026
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              Every group tracked for San Francisco.
            </h2>
          </div>
          <p className="max-w-md text-ink-body">
            Top two from each group advance to the Round of 32, joined by the
            eight best third-place finishers.
          </p>
        </div>

        <ul
          role="list"
          className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        >
          {groups.map((g) => (
            <li key={g.letter}>
              <GroupCard group={g} />
            </li>
          ))}
        </ul>
      </section>

      {/* ============================================== FIXTURES BY GROUP */}
      <section className="border-y border-rule bg-paper-deep/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            Group-stage fixtures
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            Fixtures by group.
          </h2>

          <div className="mt-14 space-y-20">
            {groups.map((g) => (
              <div
                key={g.letter}
                id={`group-${g.letter.toLowerCase()}`}
                className="scroll-mt-24"
              >
                <div className="flex items-baseline justify-between gap-6 border-b border-rule pb-4">
                  <div className="flex items-baseline gap-4">
                    <span
                      className="font-display text-5xl font-semibold leading-none text-ink"
                      style={{ letterSpacing: "-0.035em" }}
                    >
                      {g.letter}
                    </span>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
                      Group {g.letter}
                    </p>
                  </div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                    {g.teams.join(" · ")}
                  </p>
                </div>

                <ul
                  role="list"
                  className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {g.fixtures.map((f) => (
                    <li key={f.match_id}>
                      <MatchTicket fixture={f} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================== VENUES */}
      <section id="venues" className="mx-auto max-w-6xl px-6 py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          Official venues · San Francisco
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
          Officially listed. Confirmed lineup.
        </h2>
        <ol className="mt-10 divide-y divide-rule border-y border-rule">
          {venues.map((v) => (
            <li key={v.id}>
              <Link
                href={`/venues/${v.id}`}
                className="group grid grid-cols-[auto_1fr_auto] items-start gap-6 py-6 transition hover:bg-paper-deep/50"
              >
                <span
                  className={`mt-2 h-2 w-2 rounded-full ${
                    v.relevance_level === "primary"
                      ? "bg-official"
                      : v.relevance_level === "secondary"
                        ? "bg-amber"
                        : "bg-ink-muted"
                  }`}
                  aria-hidden
                />
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                    {v.relevance_level} · {v.type.replace(/_/g, " ")}
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink group-hover:text-accent">
                    {v.name}
                  </h3>
                  <p className="mt-1 text-sm text-ink-body">{v.address}</p>
                </div>
                <div className="text-right font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                  {v.indoor_outdoor}
                  <br />
                  {v.atmosphere?.vibe ?? "vibe tbd"}
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* ========================================================== BRACKET */}
      <section id="bracket" className="border-t border-rule bg-paper-deep/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            Knockout bracket · 2026
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            From the group stage to the final.
          </h2>
          <p className="mt-4 max-w-2xl text-ink-body">
            Thirty-two teams advance out of the group stage: the top two from
            each of the twelve groups, plus the eight best third-place
            finishers. From there it&apos;s straight knockout.
          </p>

          <div className="mt-12">
            <KnockoutBracket />
          </div>
        </div>
      </section>
    </main>
  );
}
