import Link from "next/link";
import { flagEmoji } from "@/lib/flags";

export type UpcomingMatchData = {
  matchId: string;
  homeCode: string;
  awayCode: string;
  stage?: string | null;        // "GROUP A"
  kickoffLabel: string;         // "Today, 18:00" / "Tomorrow, 14:00" / "Wed 24, 20:00"
  hostStadium?: string | null;
  backgroundUrl?: string | null;
};

// Strip card used in the "Upcoming matches" 3-column grid on home.
// Image header with the group chip, then time + stadium + teams below.
export default function UpcomingMatchCard({ data }: { data: UpcomingMatchData }) {
  return (
    <Link
      href={`/matches/${data.matchId}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest transition hover:-translate-y-[1px] hover:border-primary hover:shadow-ambient"
    >
      <div
        className="relative h-32 bg-surface-container"
        style={
          data.backgroundUrl
            ? {
                backgroundImage: `url(${data.backgroundUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {data.stage ? (
          <span className="absolute left-stack-md top-stack-md rounded bg-white/90 px-2 py-1 text-label-caps font-bold uppercase tracking-[0.05em] text-on-surface backdrop-blur">
            {data.stage}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-stack-sm p-stack-md">
        <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
          <span>{data.kickoffLabel}</span>
          {data.hostStadium ? <span>{data.hostStadium}</span> : null}
        </div>
        <div className="flex items-center justify-between text-headline-md font-semibold text-on-surface">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="text-base">
              {flagEmoji(data.homeCode) || "🏳️"}
            </span>
            {data.homeCode}
          </span>
          <span className="text-body-sm font-normal text-on-surface-variant">
            vs
          </span>
          <span className="inline-flex items-center gap-2">
            <span>{data.awayCode}</span>
            <span aria-hidden className="text-base">
              {flagEmoji(data.awayCode) || "🏳️"}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
