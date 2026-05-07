// Two-sided knockout tree for the 2026 FIFA World Cup.
// 48 teams → top 2 of 12 groups (24) + 8 best third-place → Round of 32.
// Below the R32 entry strip, the tree is a classic two-sided bracket with the
// Final centered: R16 · QF · SF · Final · SF · QF · R16.

type Slot = { id: string; top: string; bottom: string };

// Round of 32: 16 matches. Slot labels follow the 2026 bracket convention where
// group winners meet 3rd-place finishers and runners-up meet other runners-up
// or 3rd-place finishers, balanced across the two halves of the draw.
const R32: Slot[] = [
  { id: "r32-1", top: "1A", bottom: "3C/D/E/F" },
  { id: "r32-2", top: "1C", bottom: "3A/B/F" },
  { id: "r32-3", top: "1F", bottom: "3A/B/C" },
  { id: "r32-4", top: "1B", bottom: "3E/F/G/I" },
  { id: "r32-5", top: "1E", bottom: "3A/D/E/F" },
  { id: "r32-6", top: "1D", bottom: "2F" },
  { id: "r32-7", top: "2A", bottom: "2C" },
  { id: "r32-8", top: "2E", bottom: "2B" },
  { id: "r32-9", top: "1G", bottom: "3A/E/H/I/J" },
  { id: "r32-10", top: "1I", bottom: "3C/D/F/G/H" },
  { id: "r32-11", top: "1L", bottom: "3B/E/F/G/H" },
  { id: "r32-12", top: "1H", bottom: "3A/D/F/G/I/J" },
  { id: "r32-13", top: "1K", bottom: "3B/E/H/I/J" },
  { id: "r32-14", top: "1J", bottom: "2L" },
  { id: "r32-15", top: "2I", bottom: "2G" },
  { id: "r32-16", top: "2K", bottom: "2H" },
];

// R16: left half feeds SF·1, right half feeds SF·2.
const R16_LEFT: Slot[] = [
  { id: "r16-1", top: "W R32·1", bottom: "W R32·2" },
  { id: "r16-2", top: "W R32·3", bottom: "W R32·4" },
  { id: "r16-3", top: "W R32·5", bottom: "W R32·6" },
  { id: "r16-4", top: "W R32·7", bottom: "W R32·8" },
];
const R16_RIGHT: Slot[] = [
  { id: "r16-5", top: "W R32·9", bottom: "W R32·10" },
  { id: "r16-6", top: "W R32·11", bottom: "W R32·12" },
  { id: "r16-7", top: "W R32·13", bottom: "W R32·14" },
  { id: "r16-8", top: "W R32·15", bottom: "W R32·16" },
];

const QF_LEFT: Slot[] = [
  { id: "qf-1", top: "W R16·1", bottom: "W R16·2" },
  { id: "qf-2", top: "W R16·3", bottom: "W R16·4" },
];
const QF_RIGHT: Slot[] = [
  { id: "qf-3", top: "W R16·5", bottom: "W R16·6" },
  { id: "qf-4", top: "W R16·7", bottom: "W R16·8" },
];

const SF_LEFT: Slot = { id: "sf-1", top: "W QF·1", bottom: "W QF·2" };
const SF_RIGHT: Slot = { id: "sf-2", top: "W QF·3", bottom: "W QF·4" };

const FINAL: Slot = { id: "final", top: "W SF·1", bottom: "W SF·2" };
const THIRD_PLACE: Slot = { id: "third", top: "L SF·1", bottom: "L SF·2" };

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

  return (
    <div className={`rounded-md bg-surface ${border} ${padding}`}>
      {size === "final" ? (
        <p
          className={`font-mono ${codeSize} uppercase tracking-[0.2em] text-accent ${alignText}`}
        >
          Final · Champion
        </p>
      ) : (
        <p
          className={`font-mono ${codeSize} uppercase tracking-widest text-ink-muted ${alignText}`}
        >
          {slot.id.replace("-", " · ").toUpperCase()}
        </p>
      )}
      <p
        className={`mt-1.5 font-mono ${teamSize} font-medium uppercase tracking-wider text-ink ${alignText}`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {slot.top}
      </p>
      <p
        className={`font-mono ${codeSize} uppercase tracking-widest text-ink-muted ${alignText}`}
      >
        vs
      </p>
      <p
        className={`font-mono ${teamSize} font-medium uppercase tracking-wider text-ink ${alignText}`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {slot.bottom}
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
          <MatchSlot key={s.id} slot={s} align={align} size={size} />
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
            Round of 32 · 16 matches
          </p>
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            Top 2 from each group (24) · 8 best 3rd-place → 32 teams
          </p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {R32.map((s) => (
            <div
              key={s.id}
              className="rounded border border-rule-soft bg-paper px-2 py-2 text-center"
            >
              <p
                className="font-mono text-[11px] font-medium uppercase tracking-wider text-ink"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {s.top}
              </p>
              <p className="my-0.5 font-mono text-[9px] uppercase tracking-widest text-ink-muted">
                vs
              </p>
              <p
                className="font-mono text-[11px] font-medium uppercase tracking-wider text-ink"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {s.bottom}
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
                19 Jul 2026 · MetLife Stadium
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
            Third-place play-off
          </p>
          <p className="mt-2 max-w-md text-sm text-ink-body">
            The two semifinal losers meet one day before the final to decide
            third place in the tournament.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <MatchSlot slot={THIRD_PLACE} align="center" size="md" />
        </div>
      </div>
    </div>
  );
}
