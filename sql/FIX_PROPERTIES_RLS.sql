-- ================================================
-- FIX PROPERTIES TABLE RLS - RUN THIS NOW
-- ================================================

-- Step 1: Check which schema properties table is in
-- ================================================
SELECT 
  'Current table location:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'properties';

-- Step 2: Drop ALL existing policies on properties table (clean slate)
-- ================================================
DROP POLICY IF EXISTS "Admin full access to properties" ON public.properties;
DROP POLICY IF EXISTS "Editor can view properties" ON public.properties;
DROP POLICY IF EXISTS "Editor can update property status" ON public.properties;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.properties;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.properties;

-- Step 3: Enable RLS on properties table
-- ================================================
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies for properties table
-- ================================================

-- Policy 1: Admin has full access
CREATE POLICY "Admin full access to properties"
  ON public.properties
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policy 2: Editor can view all properties
CREATE POLICY "Editor can view properties"
  ON public.properties
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'editor'
    )
  );

-- Policy 3: Editor can update properties (app will control what fields)
CREATE POLICY "Editor can update properties"
  ON public.properties
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'editor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'editor'
    )
  );

-- Step 5: Fix rental_payments table RLS
-- ================================================
DROP POLICY IF EXISTS "Admin full access to rental_payments" ON public.rental_payments;
DROP POLICY IF EXISTS "Editor can view rental_payments" ON public.rental_payments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rental_payments;

ALTER TABLE public.rental_payments ENABLE ROW LEVEL SECURITY;

-- Admin: Full access
CREATE POLICY "Admin full access to rental_payments"
  ON public.rental_payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Editor: Can view payment history
CREATE POLICY "Editor can view rental_payments"
  ON public.rental_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'editor'
    )
  );

-- Step 6: Fix rent_notifications table RLS
-- ================================================
DROP POLICY IF EXISTS "Users can view notifications" ON public.rent_notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rent_notifications;

ALTER TABLE public.rent_notifications ENABLE ROW LEVEL SECURITY;

-- Both admin and editor can view notifications
CREATE POLICY "Users can view notifications"
  ON public.rent_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  );

-- ================================================
-- VERIFICATION
-- ================================================

-- 1. Check your role
SELECT 
  '✅ YOUR ROLE' as status,
  email,
  role
FROM public.user_roles
WHERE email = 'sukaj@admin.com';

-- 2. Check properties table RLS
SELECT 
  '✅ PROPERTIES RLS' as status,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'properties';

-- 3. Check properties policies
SELECT 
  '✅ PROPERTIES POLICIES' as status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'properties'
ORDER BY policyname;

-- 4. Count properties (should work now)
SELECT 
  '✅ PROPERTIES COUNT' as status,
  COUNT(*) as total_properties
FROM public.properties;

-- ================================================
-- EXPECTED RESULTS:
-- ================================================
-- 1. Should show your role as 'admin'
-- 2. Should show RLS enabled on properties
-- 3. Should show 3 policies created
-- 4. Should show count of properties (e.g., 74)
-- ================================================

-- If all looks good, refresh the app page!
-- ================================================
