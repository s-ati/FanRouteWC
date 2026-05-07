"use client";

import { useState } from "react";
import type { ReportType } from "@/lib/types";

type Props = {
  venueId: string;
};

const OPTIONS: { type: ReportType; label: string }[] = [
  { type: "easy_entry", label: "Easy entry" },
  { type: "some_line", label: "Some line" },
  { type: "full", label: "Full" },
  { type: "great_vibe", label: "Great vibe" },
];

type State =
  | { kind: "idle" }
  | { kind: "submitting"; type: ReportType }
  | { kind: "submitted"; type: ReportType }
  | { kind: "rate_limited" }
  | { kind: "error" };

export default function ReportButtons({ venueId }: Props) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function submit(type: ReportType) {
    setState({ kind: "submitting", type });
    try {
      const resp = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venue_id: venueId, report_type: type }),
      });
      if (resp.status === 429) {
        setState({ kind: "rate_limited" });
        return;
      }
      if (!resp.ok) {
        setState({ kind: "error" });
        return;
      }
      setState({ kind: "submitted", type });
    } catch {
      setState({ kind: "error" });
    }
  }

  const disabled =
    state.kind === "submitting" ||
    state.kind === "submitted" ||
    state.kind === "rate_limited";

  return (
    <div className="mt-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
        Tap if you&apos;re here
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {OPTIONS.map((opt) => {
          const isThisOne =
            (state.kind === "submitting" || state.kind === "submitted") &&
            state.type === opt.type;
          return (
            <button
              key={opt.type}
              type="button"
              disabled={disabled}
              onClick={() => submit(opt.type)}
              className={`rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition ${
                isThisOne
                  ? "border-ink bg-ink text-paper"
                  : "border-rule bg-paper text-ink-body hover:border-ink disabled:opacity-50"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {state.kind === "submitted" ? (
        <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-official">
          Thanks — logged.
        </p>
      ) : null}
      {state.kind === "rate_limited" ? (
        <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          Already logged a report from this device recently.
        </p>
      ) : null}
      {state.kind === "error" ? (
        <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-full-red">
          Couldn&apos;t submit. Try again in a moment.
        </p>
      ) : null}
    </div>
  );
}
