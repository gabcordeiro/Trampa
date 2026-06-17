-- Add role column to profiles (extensible for future roles)
alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'admin', 'reviewer'));

create index if not exists profiles_role_idx on public.profiles (role);

-- Security-definer helper so RLS policies can check roles without
-- recursive profile lookups
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Admin/reviewer can see ALL services (including pending/rejected)
create policy "Staff can view all services"
  on public.services for select
  using (
    status = 'approved'
    or provider_id = auth.uid()
    or get_my_role() in ('admin', 'reviewer')
  );

-- Admin/reviewer can update any service (e.g. approve/reject)
create policy "Staff can update any service"
  on public.services for update
  using (provider_id = auth.uid() or get_my_role() in ('admin', 'reviewer'))
  with check (provider_id = auth.uid() or get_my_role() in ('admin', 'reviewer'));

-- Admin can delete any service
create policy "Admin can delete any service"
  on public.services for delete
  using (provider_id = auth.uid() or get_my_role() = 'admin');

-- Admin can update any profile (e.g. change roles)
create policy "Admin can update any profile"
  on public.profiles for update
  using (id = auth.uid() or get_my_role() = 'admin')
  with check (id = auth.uid() or get_my_role() = 'admin');
