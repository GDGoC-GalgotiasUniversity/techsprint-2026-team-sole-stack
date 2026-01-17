-- Supabase schema for the `chats` table used by the app
-- Run this in the Supabase SQL editor or via psql to create the table and helpers.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the chats table (single canonical definition)
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  messages jsonb NOT NULL,
  model text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for ordering by updated time
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats (updated_at DESC);

-- Trigger helper to keep updated_at current
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

-- Recommended production approach: require authenticated users and enforce
-- row-level policies so each user can only access their own rows.
