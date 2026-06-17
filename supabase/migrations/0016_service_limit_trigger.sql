-- Enforce maximum 2 active listings for free-plan providers at the database level.
-- This prevents any client-side bypass of the limit.

create or replace function public.check_service_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Skip check for pro users
  if (select plan from public.profiles where id = NEW.provider_id) = 'pro' then
    return NEW;
  end if;

  -- Count active (non-rejected, non-paused) listings
  if (
    select count(*)
    from public.services
    where provider_id = NEW.provider_id
      and status not in ('rejected', 'paused')
  ) >= 2 then
    raise exception 'PLAN_LIMIT: Plano gratuito permite no máximo 2 anúncios ativos. Assine o Pro para criar mais.';
  end if;

  return NEW;
end;
$$;

create trigger enforce_service_limit
  before insert on public.services
  for each row
  execute function public.check_service_limit();
