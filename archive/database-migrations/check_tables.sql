-- Check if required tables exist
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
