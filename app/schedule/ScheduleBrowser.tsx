"use client";

import { useState } from "react";
import UpcomingMatchCard from "@/components/UpcomingMatchCard";
import type { MatchCardData } from "@/lib/wc2026-matches";

type Day = {
  label: string;
  iso: string;
  count: number;
  matches: MatchCardData[];
};

export default function ScheduleBrowser({ days }: { days: Day[] }) {
  // Default selection = first day with matches >= today, fallback to first day.
  const now = Date.now();
  const upcomingIdx = days.findIndex(
    (d) => new Date(d.iso).getTime() >= now,
  );
  const initial = days[upcomingIdx >= 0 ? upcomingIdx : 0]?.label ?? null;
  const [active, setActive] = useState<string | null>(initial);

  const visible =
    days.find((d) => d.label === active)?.matches ?? days[0]?.matches ?? [];

  return (
    <div>
      {/* Day picker */}
      <ul
        role="list"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      >
        {days.map((d) => {
          const selected = d.label === active;
          return (
            <li key={d.label}>
              <button
                type="button"
                onClick={() => setActive(d.label)}
                className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                  selected
                    ? "border-primary bg-primary/10 text-on-surface"
                    : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary"
                }`}
                aria-pressed={selected}
              >
                <p
                  className={`font-mono text-[11px] font-semibold uppercase tracking-[0.12em] ${
                    selected ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  {d.label}
                </p>
                <p className="mt-1 text-body-sm text-on-surface">
                  {d.count} {d.count === 1 ? "match" : "matches"}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Selected day's matches */}
      <div className="mt-section-gap">
        <p className="mb-stack-md font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
          {active ? `${active} · ${visible.length} matches` : "Select a day"}
        </p>
        {visible.length === 0 ? (
          <p className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg text-body-sm text-on-surface-variant">
            No matches on this day.
          </p>
        ) : (
          <ul
            role="list"
            className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3"
          >
            {visible.map((m) => (
              <li key={m.matchId}>
                <UpcomingMatchCard data={m} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
