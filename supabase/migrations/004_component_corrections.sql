-- Migration: component_corrections
-- Stores user-flagged component errors for improving AI parsing accuracy.
-- Each row represents one flagged component from a BOM session.

CREATE TABLE public.component_corrections (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    schematic_id UUID,
    component_id UUID,
    component_type TEXT NOT NULL,
    reported_value TEXT NOT NULL,
    correct_value TEXT,
    issue_type TEXT NOT NULL DEFAULT 'wrong_value',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- issue_type values: 'wrong_value', 'wrong_type', 'missing', 'extra', 'other'
ALTER TABLE public.component_corrections
  ADD CONSTRAINT component_corrections_issue_type_check
  CHECK (issue_type IN ('wrong_value', 'wrong_type', 'missing', 'extra', 'other'));

-- Foreign keys (nullable so corrections can be submitted even if original rows were deleted)
ALTER TABLE public.component_corrections
  ADD CONSTRAINT component_corrections_schematic_id_fkey
  FOREIGN KEY (schematic_id) REFERENCES public.schematics (id) ON DELETE SET NULL;

CREATE INDEX idx_component_corrections_schematic_id ON public.component_corrections (schematic_id);
CREATE INDEX idx_component_corrections_created_at ON public.component_corrections (created_at DESC);

-- RLS: insert is open (anonymous corrections welcome), select is admin-only
ALTER TABLE public.component_corrections ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a correction (even unauthenticated — corrections improve the AI)
CREATE POLICY "Anyone can submit corrections"
  ON public.component_corrections
  FOR INSERT
  TO public
  WITH CHECK (true);
