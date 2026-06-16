-- Service listings ("anuncios") published by providers.
create table public.services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  title text not null,
  description text not null,
  price numeric(10, 2),
  price_type text not null default 'fixed'
    check (price_type in ('fixed', 'hourly', 'quote')),
  status text not null default 'pending'
    check (status in ('draft', 'pending', 'approved', 'rejected', 'paused')),
  address text,
  city text,
  state text,
  lat double precision,
  lng double precision,
  location geography(Point, 4326),
  rating_avg numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_provider_id_idx on public.services (provider_id);
create index services_category_id_idx on public.services (category_id);
create index services_status_idx on public.services (status);
create index services_location_idx on public.services using gist (location);

alter table public.services enable row level security;

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- Keep the PostGIS point in sync with the lat/lng columns so the app can
-- write plain numbers while spatial queries (radius search) stay fast.
create or replace function public.sync_service_location()
returns trigger
language plpgsql
as $$
begin
  if new.lat is not null and new.lng is not null then
    new.location = ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326)::geography;
  else
    new.location = null;
  end if;
  return new;
end;
$$;

create trigger services_sync_location
  before insert or update of lat, lng on public.services
  for each row execute function public.sync_service_location();

-- RLS: approved listings are public; providers always see (and manage)
-- their own listings regardless of moderation status.
create policy "Approved services are publicly readable"
  on public.services for select
  using (status = 'approved' or provider_id = auth.uid());

create policy "Providers can create their own services"
  on public.services for insert
  with check (provider_id = auth.uid());

create policy "Owners can update their own services"
  on public.services for update
  using (provider_id = auth.uid())
  with check (provider_id = auth.uid());

create policy "Owners can delete their own services"
  on public.services for delete
  using (provider_id = auth.uid());
