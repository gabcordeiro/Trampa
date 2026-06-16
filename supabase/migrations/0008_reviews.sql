-- One review per completed contract, written by the client.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null unique references public.contracts (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  provider_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index reviews_service_id_idx on public.reviews (service_id);
create index reviews_provider_id_idx on public.reviews (provider_id);

alter table public.reviews enable row level security;

-- Keep the denormalized rating on services in sync for fast listing/sorting.
create or replace function public.refresh_service_rating()
returns trigger
language plpgsql
as $$
declare
  target_service_id uuid := coalesce(new.service_id, old.service_id);
begin
  update public.services s
  set rating_avg = coalesce((
        select round(avg(r.rating)::numeric, 2)
        from public.reviews r
        where r.service_id = target_service_id
      ), 0),
      rating_count = (
        select count(*) from public.reviews r where r.service_id = target_service_id
      )
  where s.id = target_service_id;
  return null;
end;
$$;

create trigger reviews_refresh_service_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_service_rating();

-- RLS: reviews are public (social proof), but can only be created by the
-- client of a contract that has reached "completed" status, and only one
-- review per contract (enforced by the unique constraint above too).
create policy "Reviews are publicly readable"
  on public.reviews for select
  using (true);

create policy "Clients can review their completed contracts"
  on public.reviews for insert
  with check (
    client_id = auth.uid()
    and exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and c.client_id = auth.uid()
        and c.status = 'completed'
        and c.service_id = reviews.service_id
        and c.provider_id = reviews.provider_id
    )
  );

create policy "Clients can edit their own reviews"
  on public.reviews for update
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "Clients can delete their own reviews"
  on public.reviews for delete
  using (client_id = auth.uid());
