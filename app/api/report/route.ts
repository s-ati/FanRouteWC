// One-tap user crowd report.
//
// POST { venue_id, report_type } from the venue detail page. Hashes
// IP + user-agent → device_hash. Rejects duplicate reports from the same
// device for the same venue inside 15 min. Inserts both the audit row in
// user_reports and a derived crowd_status row so the calculator only ever
// reads from one table.

import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { bucketFromBusyness } from "@/lib/crowd/calculate";
import { createAdminClient } from "@/lib/supabase/server";
import type { ReportType } from "@/lib/types";

const RATE_LIMIT_MIN = 15;
const REPORT_TTL_MIN = 30;

const VALID_TYPES: ReadonlySet<ReportType> = new Set([
  "easy_entry",
  "some_line",
  "full",
  "great_vibe",
]);

// great_vibe is a vibe signal, not a crowd signal — store the audit row but
// don't write a derived crowd_status. The other three map to a busyness %.
const BUSYNESS_BY_TYPE: Record<ReportType, number | null> = {
  easy_entry: 15,
  some_line: 55,
  full: 95,
  great_vibe: null,
};

function deviceHash(req: Request): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ua = req.headers.get("user-agent") ?? "unknown";
  return createHash("sha256").update(`${ip}|${ua}`).digest("hex");
}

export async function POST(req: Request) {
  let body: { venue_id?: unknown; report_type?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const venue_id = typeof body.venue_id === "string" ? body.venue_id.trim() : "";
  const report_type =
    typeof body.report_type === "string" ? (body.report_type as ReportType) : "";
  if (!venue_id || !VALID_TYPES.has(report_type as ReportType)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const now = new Date();
  const device_hash = deviceHash(req);
  const db = createAdminClient();

  // Rate-limit: same device + venue within 15 min → reject.
  const cutoff = new Date(now.getTime() - RATE_LIMIT_MIN * 60_000).toISOString();
  const { data: recent, error: dupErr } = await db
    .from("user_reports")
    .select("id")
    .eq("venue_id", venue_id)
    .eq("device_hash", device_hash)
    .gte("submitted_at", cutoff)
    .limit(1);
  if (dupErr) {
    console.error("[api.report] dedupe query failed", dupErr);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  if (recent && recent.length > 0) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // 1. Audit row
  const { error: reportErr } = await db.from("user_reports").insert({
    venue_id,
    report_type,
    device_hash,
    submitted_at: now.toISOString(),
  });
  if (reportErr) {
    if (reportErr.code === "23503") {
      return NextResponse.json({ error: "unknown_venue" }, { status: 404 });
    }
    console.error("[api.report] insert user_reports failed", reportErr);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  // 2. Derived crowd_status row (skip for great_vibe — vibe-only signal)
  const pct = BUSYNESS_BY_TYPE[report_type as ReportType];
  if (pct != null) {
    const expires_at = new Date(
      now.getTime() + REPORT_TTL_MIN * 60_000,
    ).toISOString();
    const { error: statusErr } = await db.from("crowd_status").insert({
      venue_id,
      match_id: null,
      raw_busyness_pct: pct,
      confidence: bucketFromBusyness(pct),
      source: "user_report",
      polled_at: now.toISOString(),
      expires_at,
    });
    if (statusErr) {
      console.error("[api.report] insert crowd_status failed", statusErr);
      // Don't fail the request — audit row already landed.
    }
  }

  return NextResponse.json({ ok: true });
}
