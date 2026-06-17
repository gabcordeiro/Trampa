-- Monetization: plan tiers on profiles, boost expiry on services.
-- Payments processed via Stripe; webhooks update these fields.

alter table public.profiles
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'pro')),
  add column if not exists plan_expires_at timestamptz,
  add column if not exists stripe_customer_id text unique;

alter table public.services
  add column if not exists featured_until timestamptz;

-- Update nearby_services: auto-expire boosts without a cron job
drop function if exists public.nearby_services(double precision, double precision, double precision, text);
create function public.nearby_services(
  search_lat double precision,
  search_lng double precision,
  radius_km double precision default 25,
  category_slug text default null
)
returns table (
  id uuid, provider_id uuid, category_id uuid, title text, description text,
  price numeric, price_type text, city text, state text,
  lat double precision, lng double precision,
  rating_avg numeric, rating_count integer,
  tags text[], is_featured boolean, distance_km double precision
)
language sql stable as $$
  select s.id, s.provider_id, s.category_id, s.title, s.description,
    s.price, s.price_type, s.city, s.state, s.lat, s.lng,
    s.rating_avg, s.rating_count, s.tags,
    (s.is_featured or (s.featured_until is not null and s.featured_until > now())) as is_featured,
    ST_Distance(s.location, ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography) / 1000 as distance_km
  from public.services s
  left join public.categories cat on cat.id = s.category_id
  where s.status = 'approved' and s.location is not null
    and ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography, radius_km * 1000)
    and (category_slug is null or cat.slug = category_slug)
  order by (s.is_featured or (s.featured_until is not null and s.featured_until > now())) desc, distance_km asc;
$$;
grant execute on function public.nearby_services to anon, authenticated;
