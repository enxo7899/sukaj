-- Check which schema the properties table is in
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'properties';

-- Count properties in public schema
SELECT 'PUBLIC schema' as location, COUNT(*) as count
FROM public.properties;

-- Try to count properties in app schema (if exists)
SELECT 'APP schema' as location, COUNT(*) as count
FROM app.properties;
