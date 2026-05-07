import Link from "next/link";
import type { Fixture } from "@/lib/types";
import {
  formatKickoffLocal,
  kickoffCountdown,
  matchCode,
} from "@/lib/matchday";
import { flagEmoji } from "@/lib/flags";

type Props = {
  fixture: Fixture;
  highlight?: boolean;
  now?: Date;
};

export default function MatchTicket({ fixture, highlight = false, now }: Props) {
  const countdown = kickoffCountdown(fixture, now);
  const homeFlag = flagEmoji(fixture.home_team);
  const awayFlag = flagEmoji(fixture.away_team);

  return (
    <Link
      href={`/matches/${fixture.match_id}`}
      className={`group block rounded-lg border bg-surface p-5 shadow-lift-1 transition ${
        highlight
          ? "border-accent shadow-lift-2"
          : "border-rule hover:-translate-y-[1px] hover:border-ink hover:shadow-lift-2"
      }`}
    >
      <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
        {matchCode(fixture)}
      </p>
      <div
        className="mt-3 flex items-center gap-2 font-display text-2xl font-semibold leading-tight tracking-tight text-ink"
        style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}
      >
        {homeFlag ? <span aria-hidden>{homeFlag}</span> : null}
        <span>{fixture.home_team}</span>
        <span className="text-ink-muted">v</span>
        {awayFlag ? <span aria-hidden>{awayFlag}</span> : null}
        <span>{fixture.away_team}</span>
      </div>
      <p className="mt-3 font-mono text-xs uppercase tracking-wide text-ink-body">
        {formatKickoffLocal(fixture)}
      </p>
      {highlight ? (
        <p className="mt-4 inline-block border-b border-accent pb-1 font-mono text-xs uppercase tracking-widest text-accent">
          Next · kickoff {countdown}
        </p>
      ) : (
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-ink-muted">
          {countdown}
        </p>
      )}
    </Link>
  );
}
