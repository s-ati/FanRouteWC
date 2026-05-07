-- FanRoute crowd-confidence layer — Supabase Postgres
-- Run after 0001_init.sql. Adds:
--   1. place_id + country_affiliations columns on venues (hand-curated for SerpAPI lookups)
--   2. crowd_status table — single source of truth the calculator reads from
--   3. user_reports table — append-only audit of one-tap reports

-- 1. Venue columns ----------------------------------------------------------

alter table venues add column if not exists place_id text;
alter table venues add column if not exists country_affiliations text[] not null default '{*}';

create index if not exists venues_country_affiliations_idx
  on venues using gin (country_affiliations);

-- 2. Crowd status -----------------------------------------------------------

create table if not exists crowd_status (
  id uuid primary key default uuid_generate_v4(),
  venue_id text not null references venues(id) on delete cascade,
  match_id text references fixtures(match_id) on delete set null,
  raw_busyness_pct integer check (raw_busyness_pct between 0 and 100),
  confidence text not null check (confidence in (
    'open','room','filling_up','packed','full'
  )),
  source text not null check (source in (
    'serpapi_live','serpapi_forecast',
    'outscraper_live','outscraper_forecast',
    'user_report','admin_override'
  )),
  polled_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists crowd_status_venue_polled_idx
  on crowd_status (venue_id, polled_at desc);

create index if not exists crowd_status_expires_idx
  on crowd_status (expires_at);

-- 3. User reports -----------------------------------------------------------

create table if not exists user_reports (
  id uuid primary key default uuid_generate_v4(),
  venue_id text not null references venues(id) on delete cascade,
  report_type text not null check (report_type in (
    'easy_entry','some_line','full','great_vibe'
  )),
  device_hash text not null,
  submitted_at timestamptz not null default now()
);

create index if not exists user_reports_venue_submitted_idx
  on user_reports (venue_id, submitted_at desc);

create index if not exists user_reports_device_venue_idx
  on user_reports (device_hash, venue_id, submitted_at desc);

-- 4. RLS --------------------------------------------------------------------
-- crowd_status is public-read so server components can render badges.
-- user_reports is write-only via API (no public read policy).

alter table crowd_status enable row level security;
alter table user_reports enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'crowd_status' and policyname = 'public read crowd status'
  ) then
    create policy "public read crowd status" on crowd_status for select using (true);
  end if;
end$$;
