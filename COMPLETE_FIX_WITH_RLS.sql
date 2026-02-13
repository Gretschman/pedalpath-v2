-- ============================================================================
-- COMPLETE FIX - Enable RLS + Create All Policies
-- This ensures RLS is enabled first, then creates policies
-- ============================================================================

-- STEP 1: Enable Row Level Security on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE schematics ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE enclosure_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_requirements ENABLE ROW LEVEL SECURITY;

-- STEP 2: Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'schematics',
  'schematics',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- STEP 3: Drop existing policies (if any) and recreate them
-- This ensures clean slate

-- Storage policies
DROP POLICY IF EXISTS "Users can upload schematics" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own schematics" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own schematics" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own schematics" ON storage.objects;

CREATE POLICY "Users can upload schematics"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'schematics' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own schematics"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'schematics' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own schematics"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'schematics' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own schematics"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'schematics' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Projects policies
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Schematics policies
DROP POLICY IF EXISTS "Users can insert schematics" ON schematics;
DROP POLICY IF EXISTS "Users can view own schematics" ON schematics;
DROP POLICY IF EXISTS "Users can update own schematics" ON schematics;
DROP POLICY IF EXISTS "Users can delete own schematics" ON schematics;

CREATE POLICY "Users can insert schematics"
  ON schematics FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = schematics.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own schematics"
  ON schematics FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = schematics.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own schematics"
  ON schematics FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = schematics.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own schematics"
  ON schematics FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = schematics.project_id
    AND projects.user_id = auth.uid()
  ));

-- BOM items policies
DROP POLICY IF EXISTS "Users can insert bom items" ON bom_items;
DROP POLICY IF EXISTS "Users can view own bom items" ON bom_items;
DROP POLICY IF EXISTS "Users can update own bom items" ON bom_items;
DROP POLICY IF EXISTS "Users can delete own bom items" ON bom_items;

CREATE POLICY "Users can insert bom items"
  ON bom_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = bom_items.schematic_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own bom items"
  ON bom_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = bom_items.schematic_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own bom items"
  ON bom_items FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = bom_items.schematic_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own bom items"
  ON bom_items FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = bom_items.schematic_id
    AND projects.user_id = auth.uid()
  ));

-- Enclosure recommendations policies
DROP POLICY IF EXISTS "Users can insert enclosure recommendations" ON enclosure_recommendations;
DROP POLICY IF EXISTS "Users can view own enclosure recommendations" ON enclosure_recommendations;
DROP POLICY IF EXISTS "Users can update own enclosure recommendations" ON enclosure_recommendations;
DROP POLICY IF EXISTS "Users can delete own enclosure recommendations" ON enclosure_recommendations;

CREATE POLICY "Users can insert enclosure recommendations"
  ON enclosure_recommendations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = enclosure_recommendations.schematic_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own enclosure recommendations"
  ON enclosure_recommendations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = enclosure_recommendations.schematic_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own enclosure recommendations"
  ON enclosure_recommendations FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = enclosure_recommendations.schematic_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own enclosure recommendations"
  ON enclosure_recommendations FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = enclosure_recommendations.schematic_id
    AND projects.user_id = auth.uid()
  ));

-- Power requirements policies
DROP POLICY IF EXISTS "Users can insert power requirements" ON power_requirements;
DROP POLICY IF EXISTS "Users can view own power requirements" ON power_requirements;
DROP POLICY IF EXISTS "Users can update own power requirements" ON power_requirements;
DROP POLICY IF EXISTS "Users can delete own power requirements" ON power_requirements;

CREATE POLICY "Users can insert power requirements"
  ON power_requirements FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = power_requirements.schematic_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own power requirements"
  ON power_requirements FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = power_requirements.schematic_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own power requirements"
  ON power_requirements FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = power_requirements.schematic_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own power requirements"
  ON power_requirements FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = power_requirements.schematic_id
    AND projects.user_id = auth.uid()
  ));

-- Verification
SELECT '=== RLS STATUS ===' as status;

SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('projects', 'schematics', 'bom_items', 'enclosure_recommendations', 'power_requirements')
ORDER BY tablename;

SELECT '=== POLICY COUNTS ===' as status;

SELECT 'Storage bucket' as item, COUNT(*) as count
FROM storage.buckets WHERE id = 'schematics'
UNION ALL
SELECT 'Storage policies' as item, COUNT(*) as count
FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%schematics%'
UNION ALL
SELECT 'Projects policies' as item, COUNT(*) as count
FROM pg_policies WHERE tablename = 'projects'
UNION ALL
SELECT 'Schematics policies' as item, COUNT(*) as count
FROM pg_policies WHERE tablename = 'schematics'
UNION ALL
SELECT 'BOM policies' as item, COUNT(*) as count
FROM pg_policies WHERE tablename = 'bom_items'
UNION ALL
SELECT 'Enclosure policies' as item, COUNT(*) as count
FROM pg_policies WHERE tablename = 'enclosure_recommendations'
UNION ALL
SELECT 'Power policies' as item, COUNT(*) as count
FROM pg_policies WHERE tablename = 'power_requirements';

SELECT '=== DONE ===' as status;
