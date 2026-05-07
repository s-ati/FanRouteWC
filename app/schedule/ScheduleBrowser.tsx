"use client";

import { useMemo, useRef, useState } from "react";
import UpcomingMatchCard from "@/components/UpcomingMatchCard";
import type { MatchCardData } from "@/lib/wc2026-matches";

type Day = {
  label: string;
  iso: string;
  count: number;
  matches: MatchCardData[];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type CalendarCell = {
  isoDate: string;          // YYYY-MM-DD anchored on Pacific time
  day: number;
  hasMatches: boolean;
  count: number;
  label: string;            // matching day.label when there are matches
};

type Month = {
  year: number;
  monthIndex: number;       // 0-11
  weeks: (CalendarCell | null)[][]; // 7 cells per week, null = padding
};

// Convert UTC iso into a Pacific-anchored YYYY-MM-DD key.
function ptDateKey(iso: string): string {
  const d = new Date(iso);
  // en-CA gives YYYY-MM-DD; America/Los_Angeles forces PT.
  return d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

function buildMonths(days: Day[]): Month[] {
  if (days.length === 0) return [];

  const dayByKey = new Map<string, Day>();
  for (const d of days) dayByKey.set(ptDateKey(d.iso), d);

  // Span: from the month of the first match-day to the month of the last.
  const sorted = [...days].sort(
    (a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime(),
  );
  const firstKey = ptDateKey(sorted[0].iso);
  const lastKey = ptDateKey(sorted[sorted.length - 1].iso);
  const [fy, fm] = firstKey.split("-").map(Number);
  const [ly, lm] = lastKey.split("-").map(Number);

  const months: Month[] = [];

  let y = fy;
  let m = fm - 1; // 0-indexed
  while (y < ly || (y === ly && m <= lm - 1)) {
    months.push(buildMonth(y, m, dayByKey));
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }

  return months;
}

function buildMonth(
  year: number,
  monthIndex: number,
  dayByKey: Map<string, Day>,
): Month {
  // First day of month + total days in month.
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const startWeekday = first.getUTCDay(); // 0 = Sun
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const cells: (CalendarCell | null)[] = [];
  // Leading padding so the 1st aligns with the right column.
  for (let i = 0; i < startWeekday; i++) cells.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const isoDate = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const day = dayByKey.get(isoDate);
    cells.push({
      isoDate,
      day: d,
      hasMatches: !!day,
      count: day?.count ?? 0,
      label: day?.label ?? "",
    });
  }

  // Trailing pad so we end on a full week.
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (CalendarCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return { year, monthIndex, weeks };
}

export default function ScheduleBrowser({ days }: { days: Day[] }) {
  const months = useMemo(() => buildMonths(days), [days]);
  const dayByLabel = useMemo(() => {
    const m = new Map<string, Day>();
    for (const d of days) m.set(d.label, d);
    return m;
  }, [days]);

  // Default selection = first day with matches >= today, fallback to first day.
  const now = Date.now();
  const upcomingIdx = days.findIndex(
    (d) => new Date(d.iso).getTime() >= now,
  );
  const initial = days[upcomingIdx >= 0 ? upcomingIdx : 0]?.label ?? null;
  const [active, setActive] = useState<string | null>(initial);

  const matchesRef = useRef<HTMLDivElement | null>(null);

  function selectDay(label: string) {
    setActive(label);
    // After the state flush, smooth-scroll the matches section into view.
    requestAnimationFrame(() => {
      matchesRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  const visible =
    (active ? dayByLabel.get(active)?.matches : null) ??
    days[0]?.matches ??
    [];

  return (
    <div>
      {/* Calendar — one month grid per month present in the schedule */}
      <div className="space-y-section-gap">
        {months.map((month) => (
          <div key={`${month.year}-${month.monthIndex}`}>
            <h3 className="mb-stack-md text-headline-md text-on-surface">
              {MONTH_NAMES[month.monthIndex]} {month.year}
            </h3>

            {/* Weekday header */}
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="px-2 pb-1 text-center font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant"
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-2">
              {month.weeks.flat().map((cell, i) => {
                if (!cell) {
                  return (
                    <div
                      key={`pad-${i}`}
                      aria-hidden
                      className="aspect-square rounded-md"
                    />
                  );
                }
                const selected = cell.label && cell.label === active;
                if (!cell.hasMatches) {
                  return (
                    <div
                      key={cell.isoDate}
                      className="aspect-square rounded-md border border-outline-variant/40 bg-surface-container-lowest/40 p-1.5 text-on-surface-variant md:p-2"
                    >
                      <p className="text-body-sm font-semibold opacity-50">
                        {cell.day}
                      </p>
                    </div>
                  );
                }
                return (
                  <button
                    key={cell.isoDate}
                    type="button"
                    onClick={() => selectDay(cell.label)}
                    aria-pressed={!!selected}
                    className={`group aspect-square rounded-md border p-1.5 text-left transition md:p-2 ${
                      selected
                        ? "border-primary bg-primary/10 shadow-ambient"
                        : "border-outline-variant bg-surface-container-lowest hover:border-primary"
                    }`}
                  >
                    <p
                      className={`text-headline-md font-semibold leading-none ${
                        selected ? "text-primary" : "text-on-surface"
                      }`}
                    >
                      {cell.day}
                    </p>
                    <p
                      className={`mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] ${
                        selected ? "text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      {cell.count} {cell.count === 1 ? "match" : "matches"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected day's matches */}
      <div
        ref={matchesRef}
        id="matchday"
        className="mt-section-gap scroll-mt-24"
      >
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
