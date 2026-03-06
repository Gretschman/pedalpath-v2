-- Migration 007: extend component_corrections with structured correction fields
-- Adds original_ref, corrected_type, circuit_name, reviewed, applied_to_prompt
-- Safe to run on top of existing 004_component_corrections.sql

ALTER TABLE public.component_corrections
  ADD COLUMN IF NOT EXISTS original_ref    text,          -- e.g. "R3, R7"
  ADD COLUMN IF NOT EXISTS corrected_type  text,          -- user's corrected component type
  ADD COLUMN IF NOT EXISTS circuit_name    text,          -- circuit name for easy grouping
  ADD COLUMN IF NOT EXISTS reviewed        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS applied_to_prompt boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_corrections_unreviewed
  ON public.component_corrections(reviewed) WHERE reviewed = false;

CREATE INDEX IF NOT EXISTS idx_corrections_circuit
  ON public.component_corrections(circuit_name);
