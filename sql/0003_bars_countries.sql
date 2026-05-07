-- FanRoute country onboarding + bar-affinity layer — Supabase Postgres
-- Run after 0001_init.sql and 0002_crowd_status.sql. Adds:
--   1. Optional bar metadata columns on venues (neighborhood, phone, website)
--   2. countries table — drives the onboarding screen + per-country fan-zone fallback
--   3. bar_country_affinity — N:N join between venues (bars) and countries with role+confidence
--   4. gamewatch_validation — last-validated metadata per venue from gamewatch.info

-- 1. Optional venue columns -------------------------------------------------

alter table venues add column if not exists neighborhood text;
alter table venues add column if not exists phone text;
alter table venues add column if not exists website text;

-- 2. Countries --------------------------------------------------------------

create table if not exists countries (
  country_code text primary key,
  city_id text not null references cities(id) on delete cascade,
  name text not null,
  fan_demand_tier text not null check (fan_demand_tier in (
    'very_high','high','medium','low','none'
  )),
  language text,
  match_filter_default text,
  fan_zones text[] not null default '{}',
  notes text,
  last_verified date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists countries_city_idx on countries(city_id);
create index if not exists countries_demand_idx on countries(fan_demand_tier);

-- 3. Bar ↔ country affinity -------------------------------------------------

create table if not exists bar_country_affinity (
  venue_id text not null references venues(id) on delete cascade,
  country_code text not null references countries(country_code) on delete cascade,
  role text not null check (role in (
    'home_bar','themed','cluster_lead','general_soccer'
  )),
  confidence text not null check (confidence in (
    'very_high','high','medium','low'
  )),
  rank integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (venue_id, country_code)
);

create index if not exists bar_country_affinity_country_idx
  on bar_country_affinity(country_code);
create index if not exists bar_country_affinity_venue_idx
  on bar_country_affinity(venue_id);

-- 4. Gamewatch validation ---------------------------------------------------

create table if not exists gamewatch_validation (
  venue_id text primary key references venues(id) on delete cascade,
  url text,
  rating numeric(3,2),
  views integer,
  local_rank integer,
  last_validated text,
  updated_at timestamptz not null default now()
);

-- 5. RLS --------------------------------------------------------------------

alter table countries enable row level security;
alter table bar_country_affinity enable row level security;
alter table gamewatch_validation enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'countries' and policyname = 'public read countries'
  ) then
    create policy "public read countries" on countries for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where tablename = 'bar_country_affinity' and policyname = 'public read bar country affinity'
  ) then
    create policy "public read bar country affinity"
      on bar_country_affinity for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where tablename = 'gamewatch_validation' and policyname = 'public read gamewatch validation'
  ) then
    create policy "public read gamewatch validation"
      on gamewatch_validation for select using (true);
  end if;
end$$;
