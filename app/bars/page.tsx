import Image from "next/image";
import Link from "next/link";
import Chip from "@/components/Chip";
import SectionHeader from "@/components/SectionHeader";
import { flagEmoji } from "@/lib/flags";
import { getAllVenues } from "@/lib/queries";

export const revalidate = 60;

function neighborhoodCount(
  bars: Array<{ neighborhood: string | null }>,
): number {
  const set = new Set<string>();
  for (const b of bars) {
    if (b.neighborhood) set.add(b.neighborhood);
  }
  return set.size;
}

export default async function BarsIndexPage() {
  const all = await getAllVenues().catch(() => []);
  const bars = all
    .filter((v) => v.type === "fallback_bar")
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="mx-auto max-w-7xl space-y-section-gap px-container-padding py-section-gap">
      <Link
        href="/"
        className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary"
      >
        ← BACK TO HOME
      </Link>

      <header>
        <p className="text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
          San Francisco · 2026
        </p>
        <h1 className="mt-stack-md text-display-xl text-on-surface">
          All bars
        </h1>
        <p className="mt-stack-md max-w-2xl text-body-main text-on-surface-variant">
          {bars.length} supporter and sports bars across SF, spread over{" "}
          {neighborhoodCount(bars)} neighborhoods. Tap into any one for the full
          atmosphere profile, country affiliations, and how busy it tends to
          get on match days.
        </p>
      </header>

      {bars.length === 0 ? (
        <p className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg text-body-sm text-on-surface-variant">
          No bars seeded yet.
        </p>
      ) : (
        <section>
          <SectionHeader
            title={`${bars.length} bars`}
            eyebrow="Where the supporters go"
          />
          <ul
            role="list"
            className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3"
          >
            {bars.map((v) => {
              const primaryAffinity = v.country_affiliations?.find(
                (c) => c && c !== "*",
              );
              return (
                <li key={v.id}>
                  <Link
                    href={`/venues/${v.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest transition hover:-translate-y-[1px] hover:border-primary hover:shadow-ambient"
                  >
                    <div className="relative h-44 w-full overflow-hidden bg-surface-container">
                      {v.photo_url ? (
                        <Image
                          src={v.photo_url}
                          alt={v.name}
                          width={800}
                          height={520}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-5xl">
                          {primaryAffinity
                            ? flagEmoji(primaryAffinity) || "🍺"
                            : "🍺"}
                        </div>
                      )}
                      <div className="absolute left-3 top-3">
                        <Chip tone="neutral" size="sm">
                          Bar
                        </Chip>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-stack-md p-stack-lg">
                      <div>
                        <h3 className="text-headline-md text-on-surface group-hover:text-primary">
                          {v.name}
                        </h3>
                        {v.neighborhood ? (
                          <p className="mt-1 text-body-sm text-on-surface-variant">
                            {v.neighborhood}
                          </p>
                        ) : null}
                      </div>

                      {v.address ? (
                        <p className="text-body-sm text-on-surface-variant">
                          {v.address}
                        </p>
                      ) : null}

                      <div className="mt-auto flex flex-wrap gap-2">
                        {v.atmosphere?.vibe ? (
                          <Chip tone="neutral" size="sm">
                            {v.atmosphere.vibe.replace(/^\w/, (c) =>
                              c.toUpperCase(),
                            )}
                          </Chip>
                        ) : null}
                        {primaryAffinity ? (
                          <Chip tone="neutral" size="sm">
                            <span className="mr-1" aria-hidden>
                              {flagEmoji(primaryAffinity)}
                            </span>
                            {primaryAffinity}
                          </Chip>
                        ) : null}
                        {v.indoor_outdoor ? (
                          <Chip tone="neutral" size="sm">
                            {v.indoor_outdoor.replace(/^\w/, (c) =>
                              c.toUpperCase(),
                            )}
                          </Chip>
                        ) : null}
                        {v.food_available ? (
                          <Chip tone="neutral" size="sm">
                            Food
                          </Chip>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
