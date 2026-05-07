import Image from "next/image";
import Link from "next/link";
import Chip from "@/components/Chip";
import SectionHeader from "@/components/SectionHeader";
import { getAllVenues } from "@/lib/queries";

export const revalidate = 60;

const VENUE_TYPE_LABEL: Record<string, string> = {
  official_fan_zone: "Official",
  official_watch_party: "Official",
  credible_public: "Public",
  fallback_bar: "Bar",
};

export default async function VenuesIndexPage() {
  const all = await getAllVenues().catch(() => []);
  // Show only the public watch-party / fan-zone tier (the 6 SF spots).
  const fanZones = all.filter(
    (v) =>
      v.type === "official_fan_zone" ||
      v.type === "official_watch_party" ||
      v.type === "credible_public",
  );

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
          All venues
        </h1>
        <p className="mt-stack-md max-w-2xl text-body-main text-on-surface-variant">
          The official Bay Area Host Committee fan zones and public watch
          parties for the FIFA World Cup 26. All free, all open to the public.
        </p>
      </header>

      {fanZones.length === 0 ? (
        <p className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg text-body-sm text-on-surface-variant">
          No venues seeded yet.
        </p>
      ) : (
        <section>
          <SectionHeader
            title={`${fanZones.length} official fan zones`}
            eyebrow="Where the city watches together"
          />
          <ul
            role="list"
            className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3"
          >
            {fanZones.map((v) => (
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
                        ⭐
                      </div>
                    )}
                    <div className="absolute left-3 top-3">
                      <Chip tone="primary" size="sm" icon="verified">
                        {VENUE_TYPE_LABEL[v.type] ?? "Venue"}
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

                    <p className="text-body-sm text-on-surface-variant">
                      {v.address}
                    </p>

                    <div className="mt-auto flex flex-wrap gap-2">
                      {v.indoor_outdoor ? (
                        <Chip tone="neutral" size="sm">
                          {v.indoor_outdoor.replace(/^\w/, (c) =>
                            c.toUpperCase(),
                          )}
                        </Chip>
                      ) : null}
                      {v.atmosphere?.vibe ? (
                        <Chip tone="neutral" size="sm">
                          {v.atmosphere.vibe.replace(/^\w/, (c) =>
                            c.toUpperCase(),
                          )}
                        </Chip>
                      ) : null}
                      {v.capacity_estimate ? (
                        <Chip tone="neutral" size="sm">
                          {v.capacity_estimate.toLocaleString()} cap.
                        </Chip>
                      ) : null}
                      {v.food_available ? (
                        <Chip tone="neutral" size="sm">
                          Food
                        </Chip>
                      ) : null}
                      {v.drinks_available ? (
                        <Chip tone="neutral" size="sm">
                          Drinks
                        </Chip>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
