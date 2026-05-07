import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";
import {
  mergeFixturesIntoSchedule,
  type MatchCardData,
} from "@/lib/wc2026-matches";
import { getScheduleAsMatchCards } from "@/lib/wc2026-schedule";
import { getAllFixtures } from "@/lib/queries";
import ScheduleBrowser from "./ScheduleBrowser";

export const revalidate = 60;

function dateKey(m: MatchCardData): string {
  // Anchor day on Pacific Time so a match at 23:00 UTC on June 13 lands on
  // Jun 13 PT, not Jun 14. Reuse the existing dateLabel as the bucket.
  return m.dateLabel;
}

export default async function SchedulePage() {
  const allFixtures = await getAllFixtures().catch(() => []);
  const all = mergeFixturesIntoSchedule(
    getScheduleAsMatchCards(),
    allFixtures,
  ).sort(
    (a, b) =>
      new Date(a.kickoffUtc).getTime() - new Date(b.kickoffUtc).getTime(),
  );

  // Group into match days, preserving sort order.
  const buckets = new Map<string, MatchCardData[]>();
  for (const m of all) {
    const key = dateKey(m);
    const list = buckets.get(key) ?? [];
    list.push(m);
    buckets.set(key, list);
  }

  const days = Array.from(buckets.entries()).map(([label, matches]) => ({
    label,
    iso: matches[0]?.kickoffUtc ?? "",
    count: matches.length,
    matches,
  }));

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
          2026 World Cup
        </p>
        <h1 className="mt-stack-md text-display-xl text-on-surface">
          Match days
        </h1>
        <p className="mt-stack-md max-w-2xl text-body-main text-on-surface-variant">
          {days.length} match days across {all.length} fixtures. Pick a day to
          see every game scheduled.
        </p>
      </header>

      <section>
        <SectionHeader title="Pick a match day" eyebrow="Schedule" />
        <ScheduleBrowser days={days} />
      </section>
    </main>
  );
}
