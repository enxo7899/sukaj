-- ================================================
-- COMPLETE AUTH FIX - RUN THIS ENTIRE SCRIPT
-- ================================================

-- Step 1: Create user_roles table (if not exists)
-- ================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'editor')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Step 2: Enable RLS
-- ================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing policies (clean slate)
-- ================================================
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to read roles" ON public.user_roles;
DROP POLICY IF EXISTS "Public read access" ON public.user_roles;

-- Step 4: Create SIMPLE policy - all authenticated users can read all roles
-- ================================================
-- This is safe because roles are not sensitive data
CREATE POLICY "Allow authenticated users to read roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 5: Check if admin user exists, if yes assign role
-- ================================================
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_id
  FROM auth.users
  WHERE email = 'sukaj@admin.com';

  -- If user exists, assign role
  IF admin_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, email, role)
    VALUES (admin_id, 'sukaj@admin.com', 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'admin', email = 'sukaj@admin.com';
    
    RAISE NOTICE 'Admin role assigned to user: %', admin_id;
  ELSE
    RAISE NOTICE 'Admin user not found. Create user first in Authentication > Users';
  END IF;
END $$;

-- Step 6: Check if editor user exists, if yes assign role
-- ================================================
DO $$
DECLARE
  editor_id uuid;
BEGIN
  -- Get editor user ID
  SELECT id INTO editor_id
  FROM auth.users
  WHERE email = 'sukaj@editor.com';

  -- If user exists, assign role
  IF editor_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, email, role)
    VALUES (editor_id, 'sukaj@editor.com', 'editor')
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'editor', email = 'sukaj@editor.com';
    
    RAISE NOTICE 'Editor role assigned to user: %', editor_id;
  ELSE
    RAISE NOTICE 'Editor user not found. Create user first if needed.';
  END IF;
END $$;

-- ================================================
-- VERIFICATION - Check everything is working
-- ================================================

-- Check users
SELECT 
  '1. USERS CREATED' as step,
  id, 
  email, 
  email_confirmed_at IS NOT NULL as confirmed
FROM auth.users 
WHERE email IN ('sukaj@admin.com', 'sukaj@editor.com');

-- Check roles assigned
SELECT 
  '2. ROLES ASSIGNED' as step,
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email IN ('sukaj@admin.com', 'sukaj@editor.com');

-- Check RLS is enabled
SELECT 
  '3. RLS ENABLED' as step,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'user_roles';

-- Check policy exists
SELECT 
  '4. POLICIES CREATED' as step,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_roles';

-- ================================================
-- EXPECTED RESULTS:
-- ================================================
-- Step 1: Should show admin user (and editor if created)
-- Step 2: Should show roles assigned
-- Step 3: Should show rowsecurity = true
-- Step 4: Should show "Allow authenticated users to read roles" policy
-- ================================================

-- If all 4 steps show results, authentication is WORKING!
-- Now logout and login again in the app.
-- ================================================
