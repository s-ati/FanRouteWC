import { readFileSync } from "node:fs";
import { load as parseYaml } from "js-yaml";
import type { Fixture } from "../types";

type FileFrontmatter = {
  city_id: string;
  last_verified: string | Date;
  match_count?: number;
};

function toIsoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value;
  throw new Error(`Expected date, got ${JSON.stringify(value)}`);
}

const EXPECTED_COLUMNS = [
  "match_id",
  "stage",
  "home_team",
  "away_team",
  "kickoff_local",
  "kickoff_utc",
  "played_in_bay_area",
  "host_city",
  "notes",
];

function splitFrontmatter(content: string): { frontmatter: string; body: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) throw new Error("Fixtures file is missing YAML frontmatter");
  return { frontmatter: match[1], body: match[2] };
}

function extractTableRows(body: string): string[][] {
  const lines = body.split("\n");
  const tableLines: string[] = [];
  let inTable = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("|") && line.endsWith("|")) {
      tableLines.push(line);
      inTable = true;
    } else if (inTable && line.length === 0) {
      // blank line — table might be broken up; keep scanning
      continue;
    } else if (inTable && !line.startsWith("|")) {
      // we've left the first table; stop (we only want one)
      break;
    }
  }

  if (tableLines.length < 3) {
    throw new Error(`Fixtures table has too few rows (found ${tableLines.length})`);
  }

  const rows = tableLines.map((l) =>
    l
      .slice(1, -1)
      .split("|")
      .map((c) => c.trim()),
  );

  const header = rows[0];
  const missing = EXPECTED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) {
    throw new Error(`Fixtures table missing columns: ${missing.join(", ")}`);
  }

  // Drop header row and separator row (---|---|...).
  return rows.slice(2);
}

export function parseFixturesFile(path: string): Fixture[] {
  const content = readFileSync(path, "utf8");
  const { frontmatter, body } = splitFrontmatter(content);
  const meta = (parseYaml(frontmatter) ?? {}) as FileFrontmatter;

  if (!meta.city_id) throw new Error("Fixtures frontmatter missing city_id");
  if (!meta.last_verified) throw new Error("Fixtures frontmatter missing last_verified");

  const dataRows = extractTableRows(body);
  const lastVerified = toIsoDate(meta.last_verified);

  return dataRows.map((cells) => {
    const [
      match_id,
      stage,
      home_team,
      away_team,
      kickoff_local,
      kickoff_utc,
      played_in_bay_area,
      host_city,
      notes,
    ] = cells;

    return {
      match_id,
      city_id: meta.city_id,
      stage,
      home_team,
      away_team,
      kickoff_local,
      kickoff_utc,
      played_in_bay_area: played_in_bay_area.toLowerCase() === "true",
      host_city,
      notes: notes && notes.length > 0 ? notes : null,
      last_verified: lastVerified,
    } satisfies Fixture;
  });
}
