-- ============================================================================
-- MASTER FIX - ONE SCRIPT TO FIX EVERYTHING
-- Run this ONCE in Supabase SQL Editor to fix all database issues
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE STORAGE BUCKET (if doesn't exist)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'schematics',
  'schematics',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

-- ============================================================================
-- PART 2: STORAGE BUCKET POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload schematics" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own schematics" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own schematics" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own schematics" ON storage.objects;

-- Create new policies
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

CREATE POLICY "Users can update their own schematics"
ON storage.objects FOR UPDATE
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

-- ============================================================================
-- PART 3: CREATE ALL DATABASE TABLES (if don't exist)
-- ============================================================================

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schematics table
CREATE TABLE IF NOT EXISTS schematics (
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

-- BOM Items table
CREATE TABLE IF NOT EXISTS bom_items (
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
CREATE TABLE IF NOT EXISTS enclosure_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schematic_id UUID NOT NULL REFERENCES schematics(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  drill_count INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Power requirements table
CREATE TABLE IF NOT EXISTS power_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schematic_id UUID NOT NULL REFERENCES schematics(id) ON DELETE CASCADE,
  voltage TEXT NOT NULL,
  current TEXT,
  polarity TEXT CHECK (polarity IN ('center-negative', 'center-positive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 4: CREATE INDEXES (if don't exist)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_schematics_project_id ON schematics(project_id);
CREATE INDEX IF NOT EXISTS idx_schematics_processing_status ON schematics(processing_status);
CREATE INDEX IF NOT EXISTS idx_bom_items_schematic_id ON bom_items(schematic_id);
CREATE INDEX IF NOT EXISTS idx_bom_items_component_type ON bom_items(component_type);
CREATE INDEX IF NOT EXISTS idx_enclosure_recommendations_schematic_id ON enclosure_recommendations(schematic_id);
CREATE INDEX IF NOT EXISTS idx_power_requirements_schematic_id ON power_requirements(schematic_id);

-- ============================================================================
-- PART 5: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE schematics ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE enclosure_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_requirements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 6: DROP ALL EXISTING POLICIES (clean slate)
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

DROP POLICY IF EXISTS "Users can insert schematics" ON schematics;
DROP POLICY IF EXISTS "Users can view own schematics" ON schematics;
DROP POLICY IF EXISTS "Users can update own schematics" ON schematics;
DROP POLICY IF EXISTS "Users can delete own schematics" ON schematics;
DROP POLICY IF EXISTS "Users can view schematics for their projects" ON schematics;
DROP POLICY IF EXISTS "Users can insert schematics for their projects" ON schematics;
DROP POLICY IF EXISTS "Users can update schematics for their projects" ON schematics;
DROP POLICY IF EXISTS "Users can delete schematics for their projects" ON schematics;

DROP POLICY IF EXISTS "Users can insert bom items" ON bom_items;
DROP POLICY IF EXISTS "Users can view own bom items" ON bom_items;
DROP POLICY IF EXISTS "Users can update own bom items" ON bom_items;
DROP POLICY IF EXISTS "Users can delete own bom items" ON bom_items;
DROP POLICY IF EXISTS "Users can view BOM items for their schematics" ON bom_items;
DROP POLICY IF EXISTS "Users can insert BOM items for their schematics" ON bom_items;
DROP POLICY IF EXISTS "Users can update BOM items for their schematics" ON bom_items;
DROP POLICY IF EXISTS "Users can delete BOM items for their schematics" ON bom_items;

DROP POLICY IF EXISTS "Users can insert enclosure recommendations" ON enclosure_recommendations;
DROP POLICY IF EXISTS "Users can view own enclosure recommendations" ON enclosure_recommendations;
DROP POLICY IF EXISTS "Users can update own enclosure recommendations" ON enclosure_recommendations;
DROP POLICY IF EXISTS "Users can delete own enclosure recommendations" ON enclosure_recommendations;
DROP POLICY IF EXISTS "Users can view enclosure recommendations for their schematics" ON enclosure_recommendations;
DROP POLICY IF EXISTS "Users can insert enclosure recommendations for their schematics" ON enclosure_recommendations;
DROP POLICY IF EXISTS "Users can update enclosure recommendations for their schematics" ON enclosure_recommendations;
DROP POLICY IF EXISTS "Users can delete enclosure recommendations for their schematics" ON enclosure_recommendations;

DROP POLICY IF EXISTS "Users can insert power requirements" ON power_requirements;
DROP POLICY IF EXISTS "Users can view own power requirements" ON power_requirements;
DROP POLICY IF EXISTS "Users can update own power requirements" ON power_requirements;
DROP POLICY IF EXISTS "Users can delete own power requirements" ON power_requirements;
DROP POLICY IF EXISTS "Users can view power requirements for their schematics" ON power_requirements;
DROP POLICY IF EXISTS "Users can insert power requirements for their schematics" ON power_requirements;
DROP POLICY IF EXISTS "Users can update power requirements for their schematics" ON power_requirements;
DROP POLICY IF EXISTS "Users can delete power requirements for their schematics" ON power_requirements;

-- ============================================================================
-- PART 7: CREATE ALL DATABASE POLICIES (fresh)
-- ============================================================================

-- PROJECTS POLICIES
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

-- SCHEMATICS POLICIES
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

-- BOM_ITEMS POLICIES
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

-- ENCLOSURE_RECOMMENDATIONS POLICIES
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

-- POWER_REQUIREMENTS POLICIES
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

-- ============================================================================
-- PART 8: VERIFICATION - Show what was created
-- ============================================================================

SELECT '=== TABLES CREATED ===' as status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('projects', 'schematics', 'bom_items', 'enclosure_recommendations', 'power_requirements')
ORDER BY table_name;

SELECT '=== RLS ENABLED ===' as status;
SELECT tablename, CASE WHEN rowsecurity THEN 'YES' ELSE 'NO' END as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('projects', 'schematics', 'bom_items', 'enclosure_recommendations', 'power_requirements')
ORDER BY tablename;

SELECT '=== POLICIES CREATED ===' as status;
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('projects', 'schematics', 'bom_items', 'enclosure_recommendations', 'power_requirements')
GROUP BY tablename
ORDER BY tablename;

SELECT '=== STORAGE BUCKET ===' as status;
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'schematics';

SELECT '=== STORAGE POLICIES ===' as status;
SELECT COUNT(*) as storage_policy_count FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%schematics%';

SELECT '=== ALL DONE ===' as status;
