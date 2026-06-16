-- Feed enhancements: tags + featured listings, category cover images, and a
-- location-independent "featured" feed for the landing page. These power a
-- richer, more engaging discovery experience.

alter table public.services
  add column if not exists tags text[] not null default '{}',
  add column if not exists is_featured boolean not null default false;

create index if not exists services_is_featured_idx on public.services (is_featured);
create index if not exists services_tags_idx on public.services using gin (tags);

alter table public.categories
  add column if not exists cover_url text;

-- nearby_services now also returns tags + is_featured, and surfaces featured
-- listings first within the search radius.
drop function if exists public.nearby_services(double precision, double precision, double precision, text);
create function public.nearby_services(
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
  tags text[],
  is_featured boolean,
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
    s.tags,
    s.is_featured,
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
  order by s.is_featured desc, distance_km asc;
$$;

grant execute on function public.nearby_services to anon, authenticated;

-- Trending/featured feed for the home page. Geolocation-independent so the
-- landing page always has rich content to show, with cover photo, provider
-- and category joined in.
create or replace function public.featured_services(limit_count integer default 8)
returns table (
  id uuid,
  title text,
  description text,
  price numeric,
  price_type text,
  city text,
  state text,
  rating_avg numeric,
  rating_count integer,
  tags text[],
  is_featured boolean,
  category_slug text,
  category_name text,
  provider_name text,
  provider_avatar text,
  cover_url text
)
language sql
stable
as $$
  select
    s.id,
    s.title,
    s.description,
    s.price,
    s.price_type,
    s.city,
    s.state,
    s.rating_avg,
    s.rating_count,
    s.tags,
    s.is_featured,
    cat.slug,
    cat.name,
    p.full_name,
    p.avatar_url,
    (
      select sp.url from public.service_photos sp
      where sp.service_id = s.id
      order by sp.position asc
      limit 1
    ) as cover_url
  from public.services s
  join public.categories cat on cat.id = s.category_id
  join public.profiles p on p.id = s.provider_id
  where s.status = 'approved'
  order by s.is_featured desc, s.rating_count desc, s.rating_avg desc, s.created_at desc
  limit limit_count;
$$;

grant execute on function public.featured_services to anon, authenticated;
