-- Fix Realtime RLS for messages table.
-- Without REPLICA IDENTITY FULL, Supabase Realtime cannot evaluate RLS
-- on INSERT/UPDATE events, causing messages to silently disappear for
-- authenticated users in newer Supabase versions.
alter table public.messages replica identity full;
alter table public.contracts replica identity full;
