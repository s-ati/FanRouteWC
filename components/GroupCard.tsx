import Link from "next/link";
import type { GroupSummary } from "@/lib/groups";
import { flagEmoji } from "@/lib/flags";

type Props = { group: GroupSummary };

export default function GroupCard({ group }: Props) {
  return (
    <Link
      href={`#group-${group.letter.toLowerCase()}`}
      className="group flex flex-col justify-between rounded-lg border border-rule bg-surface p-5 shadow-lift-1 transition hover:-translate-y-[1px] hover:border-accent hover:shadow-lift-2"
    >
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          Group
        </p>
        <span className="font-display text-4xl font-semibold leading-none tracking-tight text-ink">
          {group.letter}
        </span>
      </div>
      <ul
        role="list"
        className="mt-5 space-y-1.5 font-mono text-[13px] uppercase tracking-wider text-ink"
      >
        {group.teams.map((t) => {
          const flag = flagEmoji(t);
          return (
            <li key={t} className="flex items-center gap-2">
              {flag ? (
                <span aria-hidden className="text-base leading-none">
                  {flag}
                </span>
              ) : (
                <span
                  className="h-1 w-1 rounded-full bg-ink-muted group-hover:bg-accent"
                  aria-hidden
                />
              )}
              {t}
            </li>
          );
        })}
      </ul>
      <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
        {group.fixtures.length} SF fixture{group.fixtures.length === 1 ? "" : "s"} →
      </p>
    </Link>
  );
}
