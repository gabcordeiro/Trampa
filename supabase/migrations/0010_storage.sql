-- Buckets:
--   avatars/{user_id}/{filename}        -> profile photos
--   service-photos/{service_id}/{file}  -> portfolio photos for a listing
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('service-photos', 'service-photos', true)
on conflict (id) do nothing;

-- Avatars: publicly readable, writable only by the owning user (folder
-- name must match their auth uid).
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service photos: publicly readable, writable only by the provider who
-- owns the service the folder name (service id) points to.
create policy "Service photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'service-photos');

create policy "Owners can upload photos for their own services"
  on storage.objects for insert
  with check (
    bucket_id = 'service-photos'
    and exists (
      select 1 from public.services s
      where s.id::text = (storage.foldername(name))[1]
        and s.provider_id = auth.uid()
    )
  );

create policy "Owners can update photos for their own services"
  on storage.objects for update
  using (
    bucket_id = 'service-photos'
    and exists (
      select 1 from public.services s
      where s.id::text = (storage.foldername(name))[1]
        and s.provider_id = auth.uid()
    )
  );

create policy "Owners can delete photos for their own services"
  on storage.objects for delete
  using (
    bucket_id = 'service-photos'
    and exists (
      select 1 from public.services s
      where s.id::text = (storage.foldername(name))[1]
        and s.provider_id = auth.uid()
    )
  );
