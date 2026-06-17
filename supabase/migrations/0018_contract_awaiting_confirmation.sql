-- Add awaiting_confirmation status to contracts
-- Flow: provider marks done → awaiting_confirmation → client confirms → completed

alter table public.contracts
  drop constraint if exists contracts_status_check;

alter table public.contracts
  add constraint contracts_status_check
  check (status in ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'awaiting_confirmation'));
