-- ============================================================================
-- VERIFY AND FIX DATABASE SCHEMA - Run this in Supabase SQL Editor
-- This script will show you what's wrong and fix it
-- ============================================================================

-- STEP 1: Check if tables exist and show their columns
SELECT '=== CHECKING IF PROJECTS TABLE EXISTS ===' as step;
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'projects'
) as projects_exists;

-- Show actual columns in projects table (if it exists)
SELECT '=== ACTUAL COLUMNS IN PROJECTS TABLE ===' as step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'projects'
ORDER BY ordinal_position;

-- Show actual columns in schematics table (if it exists)
SELECT '=== ACTUAL COLUMNS IN SCHEMATICS TABLE ===' as step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'schematics'
ORDER BY ordinal_position;

-- STEP 2: Drop and recreate projects table with correct schema
-- This ensures we have the right columns
DROP TABLE IF EXISTS projects CASCADE;

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  schematic_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert own projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own projects"
ON projects FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
ON projects FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- STEP 3: Drop and recreate schematics table
DROP TABLE IF EXISTS schematics CASCADE;

CREATE TABLE schematics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  ai_confidence_score INTEGER CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_schematics_project_id ON schematics(project_id);
CREATE INDEX idx_schematics_processing_status ON schematics(processing_status);

ALTER TABLE schematics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert schematics"
ON schematics FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = schematics.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own schematics"
ON schematics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = schematics.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own schematics"
ON schematics FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = schematics.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own schematics"
ON schematics FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = schematics.project_id
    AND projects.user_id = auth.uid()
  )
);

-- STEP 4: Recreate other tables
DROP TABLE IF EXISTS bom_items CASCADE;

CREATE TABLE bom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_bom_items_schematic_id ON bom_items(schematic_id);
CREATE INDEX idx_bom_items_component_type ON bom_items(component_type);

ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert bom items"
ON bom_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = bom_items.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own bom items"
ON bom_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = bom_items.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own bom items"
ON bom_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = bom_items.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own bom items"
ON bom_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = bom_items.schematic_id
    AND projects.user_id = auth.uid()
  )
);

-- Enclosure recommendations
DROP TABLE IF EXISTS enclosure_recommendations CASCADE;

CREATE TABLE enclosure_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schematic_id UUID NOT NULL REFERENCES schematics(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  drill_count INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_enclosure_recommendations_schematic_id ON enclosure_recommendations(schematic_id);

ALTER TABLE enclosure_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert enclosure recommendations"
ON enclosure_recommendations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = enclosure_recommendations.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own enclosure recommendations"
ON enclosure_recommendations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = enclosure_recommendations.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own enclosure recommendations"
ON enclosure_recommendations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = enclosure_recommendations.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own enclosure recommendations"
ON enclosure_recommendations FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = enclosure_recommendations.schematic_id
    AND projects.user_id = auth.uid()
  )
);

-- Power requirements
DROP TABLE IF EXISTS power_requirements CASCADE;

CREATE TABLE power_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schematic_id UUID NOT NULL REFERENCES schematics(id) ON DELETE CASCADE,
  voltage TEXT NOT NULL,
  current TEXT,
  polarity TEXT CHECK (polarity IN ('center_negative', 'center_positive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_power_requirements_schematic_id ON power_requirements(schematic_id);

ALTER TABLE power_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert power requirements"
ON power_requirements FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = power_requirements.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own power requirements"
ON power_requirements FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = power_requirements.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own power requirements"
ON power_requirements FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = power_requirements.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own power requirements"
ON power_requirements FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = power_requirements.schematic_id
    AND projects.user_id = auth.uid()
  )
);

-- STEP 5: Verify everything was created correctly
SELECT '=== VERIFICATION: ALL TABLES ===' as step;
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('projects', 'schematics', 'bom_items', 'enclosure_recommendations', 'power_requirements')
ORDER BY table_name;

SELECT '=== VERIFICATION: PROJECTS COLUMNS ===' as step;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'projects'
ORDER BY ordinal_position;

SELECT '=== VERIFICATION: RLS STATUS ===' as step;
SELECT tablename,
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('projects', 'schematics', 'bom_items', 'enclosure_recommendations', 'power_requirements')
ORDER BY tablename;

SELECT '=== VERIFICATION: POLICY COUNTS ===' as step;
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('projects', 'schematics', 'bom_items', 'enclosure_recommendations', 'power_requirements')
GROUP BY tablename
ORDER BY tablename;

SELECT '=== ALL DONE - DATABASE IS READY ===' as step;
