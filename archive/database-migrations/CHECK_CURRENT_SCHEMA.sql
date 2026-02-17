-- ============================================================================
-- QUICK DIAGNOSTIC - Run this FIRST to see what's in your database
-- Copy and paste this into Supabase SQL Editor
-- ============================================================================

-- Check if projects table exists
SELECT '=== DOES PROJECTS TABLE EXIST? ===' as check;
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'projects'
) as projects_table_exists;

-- Show ALL columns in projects table (this will tell us if it's 'name' or 'title')
SELECT '=== PROJECTS TABLE COLUMNS (ACTUAL) ===' as check;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'projects'
ORDER BY ordinal_position;

-- Show ALL tables in public schema
SELECT '=== ALL TABLES IN DATABASE ===' as check;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS status
SELECT '=== RLS STATUS ===' as check;
SELECT tablename,
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'projects';

-- Check policies
SELECT '=== PROJECTS POLICIES ===' as check;
SELECT policyname, cmd as operation
FROM pg_policies
WHERE tablename = 'projects';
