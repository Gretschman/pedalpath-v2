-- Add Storage and BOM (Bill of Materials) support
-- This migration adds schematic storage and detailed component tracking

-- Schematics table: Stores uploaded schematic images
CREATE TABLE schematics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  ai_confidence_score INTEGER CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 100)
);

-- BOM Items table: Detailed component list from AI analysis
CREATE TABLE bom_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schematic_id UUID NOT NULL REFERENCES schematics(id) ON DELETE CASCADE,
  component_type TEXT NOT NULL,
  value TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  reference_designators TEXT[] DEFAULT ARRAY[]::TEXT[],
  part_number TEXT,
  supplier TEXT,
  supplier_url TEXT,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  verified BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enclosure recommendations table
CREATE TABLE enclosure_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schematic_id UUID NOT NULL REFERENCES schematics(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  drill_count INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Power requirements table
CREATE TABLE power_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schematic_id UUID NOT NULL REFERENCES schematics(id) ON DELETE CASCADE,
  voltage TEXT NOT NULL,
  current TEXT,
  polarity TEXT CHECK (polarity IN ('center-negative', 'center-positive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_schematics_project_id ON schematics(project_id);
CREATE INDEX idx_schematics_processing_status ON schematics(processing_status);
CREATE INDEX idx_bom_items_schematic_id ON bom_items(schematic_id);
CREATE INDEX idx_bom_items_component_type ON bom_items(component_type);
CREATE INDEX idx_enclosure_recommendations_schematic_id ON enclosure_recommendations(schematic_id);
CREATE INDEX idx_power_requirements_schematic_id ON power_requirements(schematic_id);

-- Enable RLS
ALTER TABLE schematics ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE enclosure_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_requirements ENABLE ROW LEVEL SECURITY;

-- Schematics policies: Users can access schematics for their projects
CREATE POLICY "Users can view schematics for their projects"
  ON schematics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = schematics.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert schematics for their projects"
  ON schematics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = schematics.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update schematics for their projects"
  ON schematics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = schematics.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete schematics for their projects"
  ON schematics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = schematics.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- BOM items policies
CREATE POLICY "Users can view BOM items for their schematics"
  ON bom_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM schematics
      JOIN projects ON projects.id = schematics.project_id
      WHERE schematics.id = bom_items.schematic_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert BOM items for their schematics"
  ON bom_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM schematics
      JOIN projects ON projects.id = schematics.project_id
      WHERE schematics.id = bom_items.schematic_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update BOM items for their schematics"
  ON bom_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM schematics
      JOIN projects ON projects.id = schematics.project_id
      WHERE schematics.id = bom_items.schematic_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete BOM items for their schematics"
  ON bom_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM schematics
      JOIN projects ON projects.id = schematics.project_id
      WHERE schematics.id = bom_items.schematic_id
      AND projects.user_id = auth.uid()
    )
  );

-- Enclosure recommendations policies
CREATE POLICY "Users can view enclosure recommendations for their schematics"
  ON enclosure_recommendations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM schematics
      JOIN projects ON projects.id = schematics.project_id
      WHERE schematics.id = enclosure_recommendations.schematic_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert enclosure recommendations for their schematics"
  ON enclosure_recommendations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM schematics
      JOIN projects ON projects.id = schematics.project_id
      WHERE schematics.id = enclosure_recommendations.schematic_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update enclosure recommendations for their schematics"
  ON enclosure_recommendations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM schematics
      JOIN projects ON projects.id = schematics.project_id
      WHERE schematics.id = enclosure_recommendations.schematic_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete enclosure recommendations for their schematics"
  ON enclosure_recommendations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM schematics
      JOIN projects ON projects.id = schematics.project_id
      WHERE schematics.id = enclosure_recommendations.schematic_id
      AND projects.user_id = auth.uid()
    )
  );

-- Power requirements policies
CREATE POLICY "Users can view power requirements for their schematics"
  ON power_requirements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM schematics
      JOIN projects ON projects.id = schematics.project_id
      WHERE schematics.id = power_requirements.schematic_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert power requirements for their schematics"
  ON power_requirements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM schematics
      JOIN projects ON projects.id = schematics.project_id
      WHERE schematics.id = power_requirements.schematic_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update power requirements for their schematics"
  ON power_requirements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM schematics
      JOIN projects ON projects.id = schematics.project_id
      WHERE schematics.id = power_requirements.schematic_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete power requirements for their schematics"
  ON power_requirements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM schematics
      JOIN projects ON projects.id = schematics.project_id
      WHERE schematics.id = power_requirements.schematic_id
      AND projects.user_id = auth.uid()
    )
  );

-- Storage bucket policies (to be executed in Supabase dashboard SQL editor)
-- Note: These need to be run separately as storage policies are managed differently

-- Create storage bucket (run this in Supabase Dashboard > Storage)
/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('schematics', 'schematics', false);
*/

-- Storage policies for schematics bucket
/*
CREATE POLICY "Users can upload schematics"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'schematics' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own schematics"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'schematics' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own schematics"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'schematics' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
*/
