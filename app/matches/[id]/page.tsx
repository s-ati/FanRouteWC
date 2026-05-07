import Link from "next/link";
import { notFound } from "next/navigation";
import VenueMapLazy from "@/components/VenueMapLazy";
import CrowdBadge, { sourceLabel } from "@/components/CrowdBadge";
import { getAllVenues, getFixtureById } from "@/lib/queries";
import {
  computeFallbacks,
  formatKickoffLocal,
  kickoffCountdown,
  matchCode,
  rankVenuesForFixture,
} from "@/lib/matchday";
import { enrichRankedWithRealCrowd } from "@/lib/crowd/calculate";
import { flagEmoji } from "@/lib/flags";

export const revalidate = 60;

type Params = { params: Promise<{ id: string }> };

export default async function MatchPage({ params }: Params) {
  const { id } = await params;
  const [fixture, venues] = await Promise.all([getFixtureById(id), getAllVenues()]);

  if (!fixture) notFound();

  const baseRanked = rankVenuesForFixture(venues, fixture);
  const ranked = await enrichRankedWithRealCrowd(baseRanked, fixture);
  const primary = ranked[0] ?? null;
  const fallbacks = primary
    ? await enrichRankedWithRealCrowd(
        computeFallbacks(primary.venue, venues, fixture),
        fixture,
      )
    : [];
  const mapMarkers = ranked.map((r) => ({
    id: r.venue.id,
    name: r.venue.name,
    lat: r.venue.lat,
    lng: r.venue.lng,
    tier: r.venue.relevance_level,
    href: `/venues/${r.venue.id}`,
    subtitle: r.venue.address,
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Link
        href="/#schedule"
        className="font-mono text-[11px] uppercase tracking-widest text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        ← Back to schedule
      </Link>

      <header className="mt-8 border-b border-rule pb-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
          {matchCode(fixture)}
        </p>
        <h1
          className="mt-4 flex flex-wrap items-center gap-4 font-display text-6xl font-medium leading-none tracking-tight md:text-7xl"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {flagEmoji(fixture.home_team) ? (
            <span aria-hidden>{flagEmoji(fixture.home_team)}</span>
          ) : null}
          <span>{fixture.home_team}</span>
          <span className="text-ink-muted">v</span>
          {flagEmoji(fixture.away_team) ? (
            <span aria-hidden>{flagEmoji(fixture.away_team)}</span>
          ) : null}
          <span>{fixture.away_team}</span>
        </h1>
        <p className="mt-4 font-mono text-sm uppercase tracking-wide text-ink-body">
          {formatKickoffLocal(fixture)} · kickoff {kickoffCountdown(fixture)}
        </p>
        {fixture.played_in_bay_area ? (
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-official">
            Played at Levi&apos;s Stadium — expect full fan-zone activation
          </p>
        ) : null}
        {fixture.notes ? (
          <p className="mt-6 max-w-2xl text-ink-body">{fixture.notes}</p>
        ) : null}
      </header>

      {ranked.length === 0 ? (
        <section className="mt-16 rounded-md border border-rule bg-paper-deep p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
            No officially announced venues for this match yet.
          </p>
          <p className="mt-2 text-ink-body">
            Bay Area Host Committee venue schedules are subject to FIFA and
            broadcast-partner approvals. Check back closer to kickoff.
          </p>
        </section>
      ) : (
        <>
          <section className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
                Where to watch · ranked for this match
              </p>
              <h2 className="mt-3 font-display text-3xl font-medium">
                {ranked.length} {ranked.length === 1 ? "option" : "options"} tonight.
              </h2>
              <p className="mt-3 max-w-md text-ink-body">
                Ranked by official status first, then venue size and match fit.
                Crowd states are expected pre-match — live updates land later.
              </p>
            </div>
            <VenueMapLazy markers={mapMarkers} highlightId={primary?.venue.id} />
          </section>

          <ol className="mt-12 divide-y divide-rule border-y border-rule">
            {ranked.map((r) => (
              <li key={r.venue.id} className="py-8">
                <div className="grid grid-cols-[auto_1fr_auto] items-start gap-6">
                  <span
                    className="font-display text-4xl leading-none text-ink-muted"
                    aria-hidden
                  >
                    {String(r.rank).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                      {r.venue.relevance_level} · {r.venue.type.replace(/_/g, " ")}
                    </p>
                    <Link
                      href={`/venues/${r.venue.id}`}
                      className="mt-1 block font-display text-3xl font-medium hover:underline"
                    >
                      {r.venue.name}
                    </Link>
                    <p className="mt-1 text-sm text-ink-body">{r.venue.address}</p>
                    <p className="mt-3 max-w-xl text-sm text-ink-body">{r.reason}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right">
                    <CrowdBadge
                      crowd={r.crowd}
                      source={r.crowdSource}
                      ageMin={r.crowdAgeMin}
                      rawPct={r.crowdRawPct}
                    />
                    {sourceLabel(r.crowdSource, r.crowdAgeMin) ? (
                      <span className="font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                        {sourceLabel(r.crowdSource, r.crowdAgeMin)}
                      </span>
                    ) : null}
                    <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                      {r.venue.indoor_outdoor}
                    </span>
                    {r.venue.atmosphere?.vibe ? (
                      <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                        {r.venue.atmosphere.vibe}
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {fallbacks.length > 0 ? (
            <section className="mt-16">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
                If {primary!.venue.name} fills up
              </p>
              <h2 className="mt-3 font-display text-3xl font-medium">Nearby fallback.</h2>
              <ul role="list" className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {fallbacks.map((f) => (
                  <li key={f.venue.id}>
                    <Link
                      href={`/venues/${f.venue.id}`}
                      className="block rounded-md border border-rule bg-paper p-5 transition hover:border-ink"
                    >
                      <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                        {f.distanceMi != null
                          ? `${f.distanceMi.toFixed(1)} mi · ${f.venue.relevance_level}`
                          : f.venue.relevance_level}
                      </p>
                      <p className="mt-3 font-display text-xl font-medium">
                        {f.venue.name}
                      </p>
                      <p className="mt-1 text-sm text-ink-body">{f.venue.address}</p>
                      <p className="mt-4">
                        <CrowdBadge
                          crowd={f.crowd}
                          source={f.crowdSource}
                          ageMin={f.crowdAgeMin}
                          rawPct={f.crowdRawPct}
                        />
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
