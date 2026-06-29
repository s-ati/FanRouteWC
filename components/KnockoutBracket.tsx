// Two-sided knockout tree for the 2026 FIFA World Cup, derived entirely from
// WC2026_SCHEDULE so it stays in sync with the real fixtures.
// 48 teams → top 2 of 12 groups (24) + 8 best third-place → Round of 32.
// Below the R32 entry strip, the tree is a classic two-sided bracket with the
// Final centered: R16 · QF · SF · Final · SF · QF · R16.
//
// Every slot is labelled with its exact FIFA match number (Match 73–104) and
// the real wiring (Winner Match 74 → Match 89, etc.). R32 slots already show
// the qualified teams; R16+ slots show "W<n>" (winner of match n) until those
// feeder games are played and recorded.

import {
  WC2026_SCHEDULE,
  entryDisplayNames,
  type ScheduleEntry,
} from "@/lib/wc2026-schedule";
import { getStadiumById } from "@/lib/wc2026-stadiums";
import { getTeamByCode } from "@/lib/wc2026-teams";
import { flagEmoji } from "@/lib/flags";

const BY_ID = new Map<string, ScheduleEntry>(
  WC2026_SCHEDULE.map((e) => [e.matchId, e]),
);

type Slot = {
  matchId: string;
  num: number;
  top: string;
  bottom: string;
  topFull: string;
  bottomFull: string;
};

// A participant is a real team code (resolves via getTeamByCode) or a
// placeholder like "W89" / "L101" / "T3". Show the short code either way.
function side(code: string): string {
  return getTeamByCode(code)?.code ?? code;
}

function slot(num: number): Slot {
  const e = BY_ID.get(`M${num}`);
  if (!e) {
    return {
      matchId: `M${num}`,
      num,
      top: "—",
      bottom: "—",
      topFull: "—",
      bottomFull: "—",
    };
  }
  const names = entryDisplayNames(e);
  return {
    matchId: e.matchId,
    num,
    top: side(e.homeCode),
    bottom: side(e.awayCode),
    topFull: names.homeName,
    bottomFull: names.awayName,
  };
}

// FIFA bracket topology, by match number.
const R32 = Array.from({ length: 16 }, (_, i) => slot(73 + i)); // 73–88

// Left half feeds SF Match 101 (via QF 97 + 98); right half feeds SF 102.
const R16_LEFT = [89, 90, 93, 94].map(slot);
const R16_RIGHT = [91, 92, 95, 96].map(slot);
const QF_LEFT = [97, 98].map(slot);
const QF_RIGHT = [99, 100].map(slot);
const SF_LEFT = slot(101);
const SF_RIGHT = slot(102);
const FINAL = slot(104);
const THIRD_PLACE = slot(103);

const FINAL_ENTRY = BY_ID.get("M104");
const FINAL_STADIUM = FINAL_ENTRY
  ? getStadiumById(FINAL_ENTRY.stadiumId)
  : undefined;
const FINAL_DATE = FINAL_ENTRY
  ? new Date(`${FINAL_ENTRY.dateIso}T19:00:00Z`).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "America/Los_Angeles",
    })
  : "";

function MatchSlot({
  slot,
  align = "center",
  size = "md",
}: {
  slot: Slot;
  align?: "left" | "right" | "center";
  size?: "sm" | "md" | "lg" | "final";
}) {
  const padding =
    size === "sm"
      ? "px-2.5 py-1.5"
      : size === "final"
        ? "px-4 py-4"
        : size === "lg"
          ? "px-3 py-3"
          : "px-3 py-2";

  const teamSize =
    size === "final" ? "text-sm" : size === "lg" ? "text-[13px]" : "text-[12px]";
  const codeSize = size === "sm" ? "text-[9px]" : "text-[10px]";

  const alignText =
    align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";

  const border =
    size === "final"
      ? "border-2 border-accent shadow-lift-3"
      : "border border-rule shadow-lift-1";

  // For the marquee Final/SF slots use the longer "Winner Match N" labels;
  // everywhere else stay compact with the short code. Flags resolve from the
  // short code (real team) and are empty for placeholders like "W74".
  const top = size === "final" || size === "lg" ? slot.topFull : slot.top;
  const bottom =
    size === "final" || size === "lg" ? slot.bottomFull : slot.bottom;
  const topFlag = flagEmoji(slot.top);
  const bottomFlag = flagEmoji(slot.bottom);

  const justify =
    align === "left"
      ? "justify-start"
      : align === "right"
        ? "justify-end"
        : "justify-center";

  return (
    <div className={`rounded-md bg-surface ${border} ${padding}`}>
      <p
        className={`font-mono ${codeSize} uppercase tracking-widest ${
          size === "final" ? "text-accent tracking-[0.2em]" : "text-ink-muted"
        } ${alignText}`}
      >
        {size === "final" ? `Final · Match ${slot.num}` : `Match ${slot.num}`}
      </p>
      <p
        className={`mt-1.5 flex items-center gap-1.5 ${justify} font-mono ${teamSize} font-medium uppercase tracking-wider text-ink`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {topFlag && <span className="text-[1.1em] leading-none">{topFlag}</span>}
        <span>{top}</span>
      </p>
      <p
        className={`font-mono ${codeSize} uppercase tracking-widest text-ink-muted ${alignText}`}
      >
        vs
      </p>
      <p
        className={`flex items-center gap-1.5 ${justify} font-mono ${teamSize} font-medium uppercase tracking-wider text-ink`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {bottomFlag && (
          <span className="text-[1.1em] leading-none">{bottomFlag}</span>
        )}
        <span>{bottom}</span>
      </p>
    </div>
  );
}

function Column({
  label,
  slots,
  align = "center",
  size = "md",
}: {
  label: string;
  slots: Slot[];
  align?: "left" | "right" | "center";
  size?: "sm" | "md" | "lg" | "final";
}) {
  const labelAlign =
    align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";
  return (
    <div className="flex flex-1 flex-col">
      <p
        className={`mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted ${labelAlign}`}
      >
        {label}
      </p>
      <div className="flex flex-1 flex-col justify-around gap-3">
        {slots.map((s) => (
          <MatchSlot key={s.matchId} slot={s} align={align} size={size} />
        ))}
      </div>
    </div>
  );
}

export default function KnockoutBracket() {
  return (
    <div>
      {/* Round of 32 context strip — the 16 matches that feed the main tree. */}
      <div className="rounded-lg border border-rule bg-surface p-6 shadow-lift-1">
        <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            Round of 32 · Matches 73–88
          </p>
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            Top 2 from each group (24) · 8 best 3rd-place → 32 teams
          </p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {R32.map((s) => (
            <div
              key={s.matchId}
              className="rounded border border-rule-soft bg-paper px-2 py-2 text-center"
            >
              <p className="font-mono text-[8px] uppercase tracking-widest text-ink-muted">
                Match {s.num}
              </p>
              <p
                className="mt-0.5 flex items-center justify-center gap-1 font-mono text-[11px] font-medium uppercase tracking-wider text-ink"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {flagEmoji(s.top) && <span>{flagEmoji(s.top)}</span>}
                <span>{s.top}</span>
              </p>
              <p className="my-0.5 font-mono text-[9px] uppercase tracking-widest text-ink-muted">
                vs
              </p>
              <p
                className="flex items-center justify-center gap-1 font-mono text-[11px] font-medium uppercase tracking-wider text-ink"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {flagEmoji(s.bottom) && <span>{flagEmoji(s.bottom)}</span>}
                <span>{s.bottom}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Two-sided tree: R16 · QF · SF · Final · SF · QF · R16.
          Grid columns share width equally (minmax(0,1fr)) so the tree scales
          to whatever container width is available. A small min-width below the
          md breakpoint still lets mobile scroll horizontally if needed. */}
      <div className="mt-12 overflow-x-auto md:overflow-visible">
        <div
          className="grid items-stretch gap-2 md:min-w-0"
          style={{
            gridTemplateColumns:
              "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.25fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)",
            minWidth: "720px",
          }}
        >
          <Column label="Round of 16" slots={R16_LEFT} align="left" size="sm" />
          <Column label="Quarterfinals" slots={QF_LEFT} align="left" size="sm" />
          <Column label="Semifinal" slots={[SF_LEFT]} align="left" size="md" />

          {/* Final trophy column — centered vertically, visually dominant. */}
          <div className="flex flex-1 flex-col items-center">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
              Final · Champion
            </p>
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="w-full">
                <MatchSlot slot={FINAL} align="center" size="final" />
              </div>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                {FINAL_DATE}
                {FINAL_STADIUM ? ` · ${FINAL_STADIUM.name}` : ""}
              </p>
            </div>
          </div>

          <Column label="Semifinal" slots={[SF_RIGHT]} align="right" size="md" />
          <Column label="Quarterfinals" slots={QF_RIGHT} align="right" size="sm" />
          <Column label="Round of 16" slots={R16_RIGHT} align="right" size="sm" />
        </div>
      </div>

      {/* Third-place play-off — outside the main bracket. */}
      <div className="mt-12 flex flex-col items-start gap-4 border-t border-rule pt-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            Third-place play-off · Match {THIRD_PLACE.num}
          </p>
          <p className="mt-2 max-w-md text-sm text-ink-body">
            The two semifinal losers meet one day before the final to decide
            third place in the tournament.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <MatchSlot slot={THIRD_PLACE} align="center" size="lg" />
        </div>
      </div>
    </div>
  );
}
