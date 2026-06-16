-- Portfolio photos attached to a service listing.
create table public.service_photos (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index service_photos_service_id_idx on public.service_photos (service_id);

alter table public.service_photos enable row level security;

create policy "Photos of visible services are readable"
  on public.service_photos for select
  using (
    exists (
      select 1 from public.services s
      where s.id = service_photos.service_id
        and (s.status = 'approved' or s.provider_id = auth.uid())
    )
  );

create policy "Owners can add photos to their own services"
  on public.service_photos for insert
  with check (
    exists (
      select 1 from public.services s
      where s.id = service_photos.service_id
        and s.provider_id = auth.uid()
    )
  );

create policy "Owners can update photos of their own services"
  on public.service_photos for update
  using (
    exists (
      select 1 from public.services s
      where s.id = service_photos.service_id
        and s.provider_id = auth.uid()
    )
  );

create policy "Owners can delete photos of their own services"
  on public.service_photos for delete
  using (
    exists (
      select 1 from public.services s
      where s.id = service_photos.service_id
        and s.provider_id = auth.uid()
    )
  );
