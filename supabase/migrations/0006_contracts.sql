-- A contract represents a client hiring a provider for a given service.
-- It also doubles as the "conversation" that chat messages attach to.
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete restrict,
  client_id uuid not null references public.profiles (id) on delete cascade,
  provider_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  price numeric(10, 2),
  notes text,
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contracts_client_provider_distinct check (client_id <> provider_id)
);

create index contracts_client_id_idx on public.contracts (client_id);
create index contracts_provider_id_idx on public.contracts (provider_id);
create index contracts_service_id_idx on public.contracts (service_id);

alter table public.contracts enable row level security;

create trigger contracts_set_updated_at
  before update on public.contracts
  for each row execute function public.set_updated_at();

-- RLS: only the two participants of a contract may ever see or touch it.
create policy "Participants can view their contracts"
  on public.contracts for select
  using (auth.uid() = client_id or auth.uid() = provider_id);

create policy "Clients can create contracts for approved services"
  on public.contracts for insert
  with check (
    auth.uid() = client_id
    and exists (
      select 1 from public.services s
      where s.id = service_id
        and s.provider_id = contracts.provider_id
        and s.status = 'approved'
    )
  );

create policy "Participants can update their contracts"
  on public.contracts for update
  using (auth.uid() = client_id or auth.uid() = provider_id)
  with check (auth.uid() = client_id or auth.uid() = provider_id);
