-- FanRoute venue thumbnails — Supabase Postgres
-- Run after 0003_bars_countries.sql. Adds two optional columns to venues
-- so we can render a representative photo on the country/bar surfaces.
--
-- photo_url            — typically a Google CDN URL (lh*.googleusercontent.com)
--                        sourced from SerpAPI's google_maps engine.
-- photo_attribution    — optional author/owner credit returned alongside the photo.

alter table venues add column if not exists photo_url text;
alter table venues add column if not exists photo_attribution text;
