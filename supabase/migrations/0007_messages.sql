-- Realtime chat messages, scoped to a single contract/conversation.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_contract_id_idx on public.messages (contract_id, created_at);

alter table public.messages enable row level security;
alter publication supabase_realtime add table public.messages;

-- RLS: messages are only visible/writable by the client and provider of
-- the contract they belong to.
create policy "Contract participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.contracts c
      where c.id = messages.contract_id
        and (c.client_id = auth.uid() or c.provider_id = auth.uid())
    )
  );

create policy "Contract participants can send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.contracts c
      where c.id = messages.contract_id
        and (c.client_id = auth.uid() or c.provider_id = auth.uid())
    )
  );

create policy "Contract participants can mark messages as read"
  on public.messages for update
  using (
    exists (
      select 1 from public.contracts c
      where c.id = messages.contract_id
        and (c.client_id = auth.uid() or c.provider_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.contracts c
      where c.id = messages.contract_id
        and (c.client_id = auth.uid() or c.provider_id = auth.uid())
    )
  );
