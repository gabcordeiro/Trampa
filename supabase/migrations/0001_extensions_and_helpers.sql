-- Extensions
create extension if not exists pgcrypto;
create extension if not exists postgis;

-- Generic trigger to keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
