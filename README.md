# FanRoute app

The real FanRoute product — Next.js 15 App Router, TypeScript, Tailwind, Supabase.
Source-of-truth data for MVP lives in the Obsidian vault at `../Sammy/05-project-notes/fanroute/data/` and is parsed into Supabase by `scripts/seed.ts`.

## Prerequisites

- Node 20+ (tested on 24)
- A Supabase project (free tier is fine)

## One-time setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create a Supabase project. In the SQL editor, paste and run, in order:
   - `sql/0001_init.sql` — base schema (cities, venues, fixtures)
   - `sql/0002_crowd_status.sql` — crowd-confidence + user-report layer
   - `sql/0003_bars_countries.sql` — countries + bar-country affinity + gamewatch validation
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` — Project Settings → API → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project Settings → API → anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → service_role key (server-only; never commit)
4. Seed the database from the vault:
   ```
   npm run seed:dry    # parse only, print sample rows
   npm run seed        # parse + upsert into Supabase
   ```

## Development

```
npm run dev
```

Opens at http://localhost:3000 and reads venues from Supabase.

## Updating data

The seed script is idempotent — it upserts on primary keys. Workflow:

1. Edit any of the source markdown files in the vault:
   - `venues-san-francisco.md` (6 official watch parties)
   - `bars-san-francisco.md` (51 fallback bars; the seeder skips entries with `lat: TBD`)
   - `countries-san-francisco.md` (24 countries → ranked bars + fan-zone fallback)
   - `fixtures-san-francisco.md` (52 in-scope matches)
2. Re-run `npm run seed`.
3. Refresh the app.

No admin CRUD UI by design — the markdown files are the admin surface for MVP.
See `~/.claude/projects/-Users-samuelatiye-Sammy/memory/fanroute_data_flow.md` for why.

## Layout

```
fanroute-app/
├── app/                — Next.js App Router pages
├── lib/
│   ├── data/           — markdown parsers (venues, fixtures)
│   ├── supabase/       — Supabase client factories
│   └── types.ts        — shared domain types
├── scripts/
│   └── seed.ts         — parses vault markdown → upserts into Supabase
├── sql/
│   └── 0001_init.sql   — schema migration, run once in Supabase SQL editor
└── .env.example
```
