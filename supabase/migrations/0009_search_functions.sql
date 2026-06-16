-- Radius + category search used by the Explore map/list view.
-- Only ever returns approved listings, regardless of who calls it.
create or replace function public.nearby_services(
  search_lat double precision,
  search_lng double precision,
  radius_km double precision default 25,
  category_slug text default null
)
returns table (
  id uuid,
  provider_id uuid,
  category_id uuid,
  title text,
  description text,
  price numeric,
  price_type text,
  city text,
  state text,
  lat double precision,
  lng double precision,
  rating_avg numeric,
  rating_count integer,
  distance_km double precision
)
language sql
stable
as $$
  select
    s.id,
    s.provider_id,
    s.category_id,
    s.title,
    s.description,
    s.price,
    s.price_type,
    s.city,
    s.state,
    s.lat,
    s.lng,
    s.rating_avg,
    s.rating_count,
    ST_Distance(s.location, ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography) / 1000 as distance_km
  from public.services s
  left join public.categories cat on cat.id = s.category_id
  where s.status = 'approved'
    and s.location is not null
    and ST_DWithin(
      s.location,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography,
      radius_km * 1000
    )
    and (category_slug is null or cat.slug = category_slug)
  order by distance_km asc;
$$;

grant execute on function public.nearby_services to anon, authenticated;
