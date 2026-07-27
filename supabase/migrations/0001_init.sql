-- Lamyig core schema: geographic hierarchy + Place model.
-- See docs/07-information-architecture.md and docs/08-mvp.md for the product spec this implements.

create extension if not exists "pgcrypto";

create table regions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  state text not null,
  description text,
  featured boolean not null default false, -- Spiti, Ladakh, Zanskar, Sikkim, Treks — D-009 "popular destinations"
  created_at timestamptz not null default now()
);

create table villages (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  region_id uuid not null references regions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (region_id, slug)
);

create type place_category as enum (
  'homestay', 'mechanic', 'fuel', 'food', 'drinking_water',
  'toilet', 'medical', 'camping', 'mobile_network', 'viewpoint'
);

-- Base fields per docs/08-mvp.md. Category-specific fields live in `attributes`
-- (jsonb) rather than one sparse column per category — see that doc's field table.
create table places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category place_category not null,
  lat double precision not null,
  lng double precision not null,
  village_id uuid not null references villages(id) on delete restrict,
  region_id uuid not null references regions(id) on delete restrict,
  description text not null,
  phone text,
  whatsapp text,
  price_range text,
  attributes jsonb not null default '{}'::jsonb,
  added_by uuid not null references auth.users(id) on delete restrict,
  last_edited_by uuid not null references auth.users(id) on delete restrict,
  last_verified_at timestamptz,
  verified_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index places_village_id_idx on places(village_id);
create index places_region_id_idx on places(region_id);
create index places_category_idx on places(category);

create table place_photos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  storage_path text not null,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index place_photos_place_id_idx on place_photos(place_id);

-- Community Notes replace star ratings — D-004.
create table community_notes (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now()
);

create index community_notes_place_id_idx on community_notes(place_id);

create table place_verifications (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  verified_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (place_id, verified_by)
);

create type report_reason as enum ('spam', 'incorrect', 'closed', 'duplicate');

-- Manual review in V1, no automated takedown — D-012.
create table place_reports (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete restrict,
  reason report_reason not null,
  note text,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- Keep `updated_at` / `last_edited_by` honest on every wiki-style edit — D-012.
create or replace function set_place_edit_metadata()
returns trigger as $$
begin
  new.updated_at = now();
  new.last_edited_by = coalesce(auth.uid(), new.last_edited_by);
  return new;
end;
$$ language plpgsql;

create trigger places_set_edit_metadata
  before update on places
  for each row execute function set_place_edit_metadata();

create or replace function bump_place_verification()
returns trigger as $$
begin
  update places
    set last_verified_at = new.created_at,
        verified_count = verified_count + 1
    where id = new.place_id;
  return new;
end;
$$ language plpgsql;

create trigger place_verifications_bump
  after insert on place_verifications
  for each row execute function bump_place_verification();
