import { flagEmoji } from "@/lib/flags";

export type StandingsRow = {
  countryCode: string;
  name?: string | null;     // optional pretty name; falls back to code
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalDiff: number;
  points: number;
  position?: number | null;
};

// Stitch-style standings table. Hairline borders, label-caps headers,
// primary-tinted "Pts" column, soft-tint highlight on the picked team.
export default function StandingsTable({
  groupLetter,
  rows,
  highlightCode,
}: {
  groupLetter: string;
  rows: StandingsRow[];
  highlightCode?: string | null;
}) {
  const sorted = [...rows].sort((a, b) => {
    if (a.position != null && b.position != null) return a.position - b.position;
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return a.countryCode.localeCompare(b.countryCode);
  });
  const leaderCode = sorted[0]?.countryCode ?? null;

  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-outline-variant bg-surface-container-low text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface-variant">
            <th className="px-4 py-3 font-bold">Group {groupLetter}</th>
            <th className="px-3 py-3 text-center font-bold">P</th>
            <th className="px-3 py-3 text-center font-bold">W</th>
            <th className="px-3 py-3 text-center font-bold">D</th>
            <th className="px-3 py-3 text-center font-bold">L</th>
            <th className="px-3 py-3 text-center font-bold">GD</th>
            <th className="px-4 py-3 text-center text-primary">Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const isHighlight =
              !!highlightCode && row.countryCode === highlightCode.toUpperCase();
            const isLeader = row.countryCode === leaderCode;
            return (
              <tr
                key={row.countryCode}
                className={`border-b border-outline-variant last:border-b-0 transition-colors hover:bg-surface-container-lowest ${isHighlight ? "bg-primary/5" : ""}`}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-stack-md">
                    <span
                      className={`block h-2 w-2 rounded-full ${isLeader ? "bg-primary" : "bg-outline-variant"}`}
                      aria-hidden
                    />
                    <span aria-hidden className="text-base leading-none">
                      {flagEmoji(row.countryCode) || "🏳️"}
                    </span>
                    <span className="text-body-main font-semibold text-on-surface">
                      {row.name ?? row.countryCode}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4 text-center text-on-surface-variant">{row.played}</td>
                <td className="px-3 py-4 text-center text-on-surface">{row.wins}</td>
                <td className="px-3 py-4 text-center text-on-surface">{row.draws}</td>
                <td className="px-3 py-4 text-center text-on-surface">{row.losses}</td>
                <td className="px-3 py-4 text-center text-on-surface">
                  {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                </td>
                <td className="px-4 py-4 text-center font-bold text-primary">
                  {row.points}
                </td>
              </tr>
            );
          })}
          {sorted.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-8 text-center text-body-sm text-on-surface-variant"
              >
                Standings populate once the tournament begins.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
