-- Supabase schema for the `chats` table used by the app
-- Run this in the Supabase SQL editor or via psql to create the table and helpers.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  messages jsonb NOT NULL,
  model text NOT NULL,
  user_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats (updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at ON public.chats;
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Optional: enable RLS and add a permissive dev policy (enable only for debugging!)
-- ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY allow_anon_all ON public.chats FOR ALL USING (true) WITH CHECK (true);
-- Supabase schema for chat history

-- Create the chats table
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  messages jsonb not null,
  model text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for ordering by updated time
create index if not exists idx_chats_updated_at on public.chats (updated_at desc);

-- Note: By default, Supabase enables RLS. For development you can either
-- disable RLS for this table or create a permissive policy. The following
-- policies are development-only and allow public (anon) access. Use with care.
--
-- -- Enable RLS (if not already enabled)
-- alter table public.chats enable row level security;
--
-- -- Allow full public access (development only)
-- create policy public_full_access on public.chats for all using (true) with check (true);

-- Recommended production approach: add a `user_id` column and require
-- authenticated users, then enforce policies that restrict each user to
-- their own rows.
