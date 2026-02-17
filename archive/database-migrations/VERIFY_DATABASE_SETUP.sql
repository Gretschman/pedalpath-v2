-- ============================================================================
-- COMPREHENSIVE DATABASE VERIFICATION
-- Run this entire script to verify everything is set up correctly
-- ============================================================================

-- 1. Check all required tables exist
SELECT '=== TABLES CHECK ===' as check_type;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'projects',
    'schematics',
    'bom_items',
    'enclosure_recommendations',
    'power_requirements'
  )
ORDER BY table_name;

-- 2. Check RLS is enabled on all tables
SELECT '=== RLS ENABLED CHECK ===' as check_type;
SELECT
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED ✓' ELSE 'DISABLED ✗' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'projects',
    'schematics',
    'bom_items',
    'enclosure_recommendations',
    'power_requirements'
  )
ORDER BY tablename;

-- 3. Count policies per table
SELECT '=== POLICY COUNT CHECK ===' as check_type;
SELECT
  tablename,
  COUNT(*) as policy_count,
  CASE
    WHEN COUNT(*) >= 4 THEN '✓ Complete'
    WHEN COUNT(*) > 0 THEN '⚠ Incomplete'
    ELSE '✗ Missing'
  END as status
FROM pg_policies
WHERE tablename IN (
  'projects',
  'schematics',
  'bom_items',
  'enclosure_recommendations',
  'power_requirements'
)
GROUP BY tablename
ORDER BY tablename;

-- 4. List all policies with their commands
SELECT '=== ALL POLICIES DETAIL ===' as check_type;
SELECT
  tablename,
  policyname,
  cmd as command,
  CASE
    WHEN roles::text LIKE '%authenticated%' THEN 'authenticated'
    ELSE roles::text
  END as applies_to
FROM pg_policies
WHERE tablename IN (
  'projects',
  'schematics',
  'bom_items',
  'enclosure_recommendations',
  'power_requirements'
)
ORDER BY tablename, cmd;

-- 5. Check if there are any existing records (to see if anything worked)
SELECT '=== EXISTING DATA CHECK ===' as check_type;
SELECT
  'projects' as table_name,
  COUNT(*) as record_count
FROM projects

UNION ALL

SELECT
  'schematics' as table_name,
  COUNT(*) as record_count
FROM schematics

UNION ALL

SELECT
  'bom_items' as table_name,
  COUNT(*) as record_count
FROM bom_items;

-- 6. Test if we can see the schema of critical tables
SELECT '=== TABLE SCHEMA CHECK ===' as check_type;
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('projects', 'schematics')
  AND column_name IN ('id', 'user_id', 'project_id')
ORDER BY table_name, ordinal_position;
