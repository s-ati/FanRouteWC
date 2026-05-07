import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import VenueMapLazy from "@/components/VenueMapLazy";
import MatchTicket from "@/components/MatchTicket";
import CrowdBadge, { sourceLabel } from "@/components/CrowdBadge";
import ReportButtons from "@/components/ReportButtons";
import {
  getAllFixtures,
  getAllVenues,
  getCountryByCode,
  getRankedBarsForCountry,
  getVenueById,
} from "@/lib/queries";
import { venueQualifiesForFixture } from "@/lib/matchday";
import { calculateCrowdConfidence } from "@/lib/crowd/calculate";
import { readPickedCountry } from "@/lib/country-cookie";
import { flagEmoji } from "@/lib/flags";
import { demonym } from "@/lib/demonyms";
import { getTeamByCode } from "@/lib/wc2026-teams";

export const revalidate = 60;

type Params = { params: Promise<{ id: string }> };

function splitNotes(notes: string | null): string[] {
  if (!notes) return [];
  return notes
    .split(/\. (?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.endsWith(".") ? s : `${s}.`));
}

export default async function VenuePage({ params }: Params) {
  const { id } = await params;
  const [venue, fixtures, allVenues, pickedCode] = await Promise.all([
    getVenueById(id),
    getAllFixtures(),
    getAllVenues(),
    readPickedCountry(),
  ]);

  if (!venue) notFound();

  const showing = fixtures.filter((f) => venueQualifiesForFixture(venue, f));
  const upcomingShowing = showing.filter(
    (f) => new Date(f.kickoff_utc).getTime() >= Date.now(),
  );
  const fixturesForCountry = pickedCode
    ? upcomingShowing.filter(
        (f) => f.home_team === pickedCode || f.away_team === pickedCode,
      )
    : null;
  const matchesToShow = fixturesForCountry ?? upcomingShowing;

  const pickedTeam = pickedCode ? getTeamByCode(pickedCode) : null;
  const pickedCountryRow = pickedCode
    ? await getCountryByCode(pickedCode).catch(() => null)
    : null;
  const pickedDisplayName =
    pickedCountryRow?.name ?? pickedTeam?.name ?? pickedCode ?? null;
  const pickedDemonym = pickedCode ? demonym(pickedCode) : null;
  const otherCountryBars = pickedCode
    ? (await getRankedBarsForCountry(pickedCode).catch(() => [])).filter(
        (b) => b.venue.id !== venue.id,
      )
    : [];

  // For the "right now" badge we need a fixture context (rule-based fallback
  // uses time-to-kickoff). Use the next upcoming fixture this venue qualifies
  // for; if there isn't one, skip the badge entirely.
  const referenceFixture = upcomingShowing[0] ?? null;
  const crowdNow = referenceFixture
    ? await calculateCrowdConfidence(venue, referenceFixture)
    : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Link
        href="/#venues"
        className="font-mono text-[11px] uppercase tracking-widest text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        ← Back to venues
      </Link>

      <header className="mt-8 border-b border-rule pb-10">
        {venue.photo_url ? (
          <div className="mb-8 overflow-hidden rounded-lg border border-rule">
            <Image
              src={venue.photo_url}
              alt={venue.name}
              width={1200}
              height={600}
              sizes="(max-width: 768px) 100vw, 1024px"
              className="h-64 w-full object-cover md:h-80"
              priority
            />
          </div>
        ) : null}
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
          {venue.relevance_level} · {venue.type.replace(/_/g, " ")}
        </p>
        <h1 className="mt-4 font-display text-6xl font-medium leading-none tracking-tight md:text-7xl">
          {venue.name}
        </h1>
        <p className="mt-4 text-ink-body">{venue.address}</p>
        <dl className="mt-8 grid grid-cols-2 gap-4 font-mono text-[11px] uppercase tracking-widest text-ink-muted sm:grid-cols-4">
          <div>
            <dt>Setting</dt>
            <dd className="mt-1 text-ink">{venue.indoor_outdoor}</dd>
          </div>
          <div>
            <dt>Vibe</dt>
            <dd className="mt-1 text-ink">{venue.atmosphere?.vibe ?? "TBD"}</dd>
          </div>
          <div>
            <dt>Team bias</dt>
            <dd className="mt-1 text-ink">{venue.atmosphere?.team_bias ?? "TBD"}</dd>
          </div>
          <div>
            <dt>Capacity</dt>
            <dd className="mt-1 text-ink">
              {venue.capacity_estimate != null
                ? venue.capacity_estimate.toLocaleString()
                : "TBD"}
            </dd>
          </div>
        </dl>
      </header>

      {crowdNow ? (
        <section className="mt-10 rounded-md border border-rule bg-paper-deep p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                Right now
              </p>
              <div className="mt-2">
                <CrowdBadge
                  crowd={crowdNow.crowd}
                  source={crowdNow.source}
                  ageMin={crowdNow.ageMin}
                  rawPct={crowdNow.raw_pct}
                />
              </div>
              {sourceLabel(crowdNow.source, crowdNow.ageMin) ? (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                  {sourceLabel(crowdNow.source, crowdNow.ageMin)}
                  {crowdNow.polledAt
                    ? ` · ${crowdNow.polledAt.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}`
                    : null}
                </p>
              ) : null}
            </div>
          </div>
          <ReportButtons venueId={venue.id} />
        </section>
      ) : null}

      <section className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.1fr]">
        <div>
          {venue.description ? (
            <div className="space-y-4 text-ink-body">
              {venue.description
                .split(/\n{2,}/)
                .map((p, i) => <p key={i}>{p}</p>)}
            </div>
          ) : null}

          <ul role="list" className="mt-6 space-y-2 text-sm text-ink-body">
            {splitNotes(venue.notes).map((n, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-ink-muted">·</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>

          {venue.source_urls.length > 0 ? (
            <div className="mt-8">
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                Sources
              </p>
              <ul role="list" className="mt-3 space-y-1 text-sm">
                {venue.source_urls.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-body underline underline-offset-2 hover:text-ink"
                    >
                      {new URL(url).hostname.replace(/^www\./, "")}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <VenueMapLazy
          markers={allVenues.map((v) => ({
            id: v.id,
            name: v.name,
            lat: v.lat,
            lng: v.lng,
            tier: v.relevance_level,
            href: `/venues/${v.id}`,
            subtitle: v.address,
          }))}
          highlightId={venue.id}
        />
      </section>

      <section className="mt-20">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
          {pickedCode && pickedDisplayName ? (
            <>
              {flagEmoji(pickedCode)} {pickedDisplayName} matches at {venue.name}
            </>
          ) : (
            <>Matches showing at {venue.name}</>
          )}
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium">
          {matchesToShow.length} upcoming fixture
          {matchesToShow.length === 1 ? "" : "s"}.
        </h2>
        {matchesToShow.length === 0 ? (
          <p className="mt-4 text-ink-body">
            {pickedCode && pickedDisplayName
              ? `No upcoming ${pickedDisplayName} matches at this bar.`
              : "No upcoming fixtures match this venue’s filter yet."}
          </p>
        ) : (
          <ul
            role="list"
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {matchesToShow.slice(0, 9).map((f) => (
              <li key={f.match_id}>
                <MatchTicket fixture={f} />
              </li>
            ))}
          </ul>
        )}
        {pickedCode && pickedDisplayName ? (
          <p className="mt-6 text-sm text-ink-muted">
            Filtered to {pickedDisplayName} matches.{" "}
            <Link
              href="/onboarding"
              className="underline underline-offset-4 hover:text-ink"
            >
              change country
            </Link>
            .
          </p>
        ) : null}
      </section>

      {pickedCode && otherCountryBars.length ? (
        <section className="mt-20 border-t border-rule pt-16">
          <h2
            className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl"
            style={{ letterSpacing: "-0.025em" }}
          >
            {pickedDemonym
              ? `More ${pickedDemonym.toLowerCase()}-fan bars`
              : `More ${pickedDisplayName} bars`}
          </h2>
          <ol className="mt-10 divide-y divide-rule border-y border-rule">
            {otherCountryBars.map((b) => (
              <li key={b.venue.id}>
                <Link
                  href={`/venues/${b.venue.id}`}
                  className="group flex items-center justify-between gap-6 px-2 py-5 transition hover:bg-paper-deep/40"
                >
                  <div>
                    <h3
                      className="font-display text-2xl font-semibold tracking-tight text-ink group-hover:text-accent"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {b.venue.name}
                    </h3>
                    {b.venue.neighborhood ? (
                      <p className="mt-1 text-sm text-ink-body">
                        {b.venue.neighborhood}
                      </p>
                    ) : null}
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </main>
  );
}
