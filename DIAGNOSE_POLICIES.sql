-- ============================================================================
-- DIAGNOSTIC QUERY - Check current state of RLS and policies
-- Run this in Supabase SQL Editor to see what's missing
-- ============================================================================

-- 1. Check if RLS is enabled on tables
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('projects', 'schematics', 'bom_items', 'enclosure_recommendations', 'power_requirements')
ORDER BY tablename;

-- 2. Check storage bucket
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'schematics';

-- 3. Check storage policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%schematics%'
ORDER BY policyname;

-- 4. Check database policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('projects', 'schematics', 'bom_items', 'enclosure_recommendations', 'power_requirements')
ORDER BY tablename, cmd, policyname;

-- 5. Summary counts
SELECT 'RLS Tables' as category, COUNT(*) as count
FROM pg_tables
WHERE tablename IN ('projects', 'schematics', 'bom_items', 'enclosure_recommendations', 'power_requirements')
  AND rowsecurity = true

UNION ALL

SELECT 'Storage Buckets' as category, COUNT(*) as count
FROM storage.buckets
WHERE id = 'schematics'

UNION ALL

SELECT 'Storage Policies' as category, COUNT(*) as count
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%schematics%'

UNION ALL

SELECT 'Projects Policies' as category, COUNT(*) as count
FROM pg_policies
WHERE tablename = 'projects'

UNION ALL

SELECT 'Schematics Policies' as category, COUNT(*) as count
FROM pg_policies
WHERE tablename = 'schematics'

UNION ALL

SELECT 'BOM Items Policies' as category, COUNT(*) as count
FROM pg_policies
WHERE tablename = 'bom_items'

UNION ALL

SELECT 'Enclosure Policies' as category, COUNT(*) as count
FROM pg_policies
WHERE tablename = 'enclosure_recommendations'

UNION ALL

SELECT 'Power Policies' as category, COUNT(*) as count
FROM pg_policies
WHERE tablename = 'power_requirements';
