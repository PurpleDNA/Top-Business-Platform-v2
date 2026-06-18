-- Add a `transfer` column to productions.
--
-- This mirrors the existing `cash` column exactly: a non-negative money amount,
-- defaulting to 0, that is edited on the dedicated production page and counts
-- toward "money in" in the financial summary. Same type/default/constraint as
-- `cash` so the two behave identically everywhere.
--
-- Run this in the Supabase SQL editor (or via supabase db push).

ALTER TABLE public.productions
  ADD COLUMN IF NOT EXISTS transfer numeric(10,2) DEFAULT 0 NOT NULL;
