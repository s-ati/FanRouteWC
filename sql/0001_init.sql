-- FanRoute MVP schema — Supabase Postgres
-- Run once in the Supabase SQL editor, then use scripts/seed.ts to populate.

create extension if not exists "uuid-ossp";

-- Cities --------------------------------------------------------------------

create table if not exists cities (
  id text primary key,
  name text not null,
  country text not null default 'US',
  timezone text not null default 'America/Los_Angeles',
  created_at timestamptz not null default now()
);

insert into cities (id, name) values ('san-francisco', 'San Francisco')
  on conflict (id) do nothing;

-- Venues --------------------------------------------------------------------

create table if not exists venues (
  id text primary key,
  city_id text not null references cities(id) on delete cascade,
  name text not null,
  type text not null check (type in (
    'official_fan_zone','official_watch_party','credible_public','fallback_bar'
  )),
  source_type text not null check (source_type in (
    'fifa_official','city_backed','partner','credible_public','community'
  )),
  address text not null,
  lat double precision not null,
  lng double precision not null,
  capacity_estimate integer,
  indoor_outdoor text not null check (indoor_outdoor in ('indoor','outdoor','mixed')),
  food_available boolean,
  drinks_available boolean,
  active boolean not null default true,
  relevance_level text not null check (relevance_level in ('primary','secondary','fallback')),
  likely_showing boolean not null default true,
  source_urls text[] not null default '{}',
  notes text,
  description text,
  last_verified date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists venues_city_idx on venues(city_id);
create index if not exists venues_relevance_idx on venues(relevance_level);

-- Venue atmosphere ----------------------------------------------------------

create table if not exists venue_atmosphere (
  venue_id text primary key references venues(id) on delete cascade,
  vibe text check (vibe in ('hardcore','party','family','mixed')),
  team_bias text,
  language text,
  sound_on_likelihood text check (sound_on_likelihood in ('high','medium','low')),
  updated_at timestamptz not null default now()
);

-- Venue match rules ---------------------------------------------------------

create table if not exists venue_match_rules (
  venue_id text primary key references venues(id) on delete cascade,
  match_filter text,
  updated_at timestamptz not null default now()
);

-- Fixtures ------------------------------------------------------------------

create table if not exists fixtures (
  match_id text primary key,
  city_id text not null references cities(id) on delete cascade,
  stage text not null,
  home_team text not null,
  away_team text not null,
  kickoff_local timestamptz not null,
  kickoff_utc timestamptz not null,
  played_in_bay_area boolean not null default false,
  host_city text not null,
  notes text,
  last_verified date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fixtures_city_idx on fixtures(city_id);
create index if not exists fixtures_kickoff_idx on fixtures(kickoff_utc);

-- Read-only RLS for the public app ------------------------------------------
-- The seed script uses the service_role key, which bypasses RLS.

alter table venues enable row level security;
alter table venue_atmosphere enable row level security;
alter table venue_match_rules enable row level security;
alter table fixtures enable row level security;
alter table cities enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'venues' and policyname = 'public read venues') then
    create policy "public read venues" on venues for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'venue_atmosphere' and policyname = 'public read atmosphere') then
    create policy "public read atmosphere" on venue_atmosphere for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'venue_match_rules' and policyname = 'public read match rules') then
    create policy "public read match rules" on venue_match_rules for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'fixtures' and policyname = 'public read fixtures') then
    create policy "public read fixtures" on fixtures for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'cities' and policyname = 'public read cities') then
    create policy "public read cities" on cities for select using (true);
  end if;
end$$;
