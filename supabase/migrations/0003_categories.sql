-- Fixed catalog of service categories. Managed by admins (service role),
-- read-only for everyone else.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon text not null default 'sparkles',
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Categories are publicly readable"
  on public.categories for select
  using (true);

insert into public.categories (slug, name, icon) values
  ('cleaning', 'Limpeza', 'spray-can'),
  ('plumbing', 'Encanamento', 'wrench'),
  ('electrical', 'Elétrica', 'zap'),
  ('painting', 'Pintura', 'paint-roller'),
  ('gardening', 'Jardinagem', 'leaf'),
  ('moving', 'Mudanças', 'truck'),
  ('tech-repair', 'Assistência Técnica', 'laptop'),
  ('beauty', 'Beleza e Estética', 'scissors'),
  ('tutoring', 'Aulas Particulares', 'book-open'),
  ('pet-care', 'Cuidado com Pets', 'dog'),
  ('events', 'Eventos', 'party-popper'),
  ('other', 'Outros', 'sparkles');
