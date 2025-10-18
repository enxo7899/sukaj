-- ================================================
-- SIMPLE AUTH FIX - RUN THIS COMPLETE SCRIPT
-- ================================================

-- Step 1: Drop and recreate user_roles table with proper constraints
-- ================================================
DROP TABLE IF EXISTS public.user_roles CASCADE;

CREATE TABLE public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'editor')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_email ON public.user_roles(email);

-- Step 2: Enable RLS and create policy
-- ================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Simple policy: all authenticated users can read all roles
CREATE POLICY "Allow authenticated users to read roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 3: Assign roles to existing users
-- ================================================

-- Admin role
INSERT INTO public.user_roles (user_id, email, role)
SELECT id, 'sukaj@admin.com', 'admin'
FROM auth.users
WHERE email = 'sukaj@admin.com'
ON CONFLICT (user_id) DO NOTHING;

-- Editor role (if user exists)
INSERT INTO public.user_roles (user_id, email, role)
SELECT id, 'sukaj@editor.com', 'editor'
FROM auth.users
WHERE email = 'sukaj@editor.com'
ON CONFLICT (user_id) DO NOTHING;

-- ================================================
-- VERIFICATION
-- ================================================

-- 1. Check table structure
SELECT 
  '✅ TABLE STRUCTURE' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;

-- 2. Check users and roles
SELECT 
  '✅ USERS & ROLES' as status,
  u.email,
  ur.role,
  u.email_confirmed_at IS NOT NULL as confirmed
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email IN ('sukaj@admin.com', 'sukaj@editor.com');

-- 3. Check RLS
SELECT 
  '✅ RLS STATUS' as status,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_roles';

-- 4. Check policies
SELECT 
  '✅ POLICIES' as status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_roles';

-- ================================================
-- SUCCESS! 
-- ================================================
-- If you see:
-- 1. Table structure with user_id column
-- 2. Your email with 'admin' role
-- 3. RLS enabled = true
-- 4. Policy created
--
-- Then authentication is READY! 
-- Logout and login again to test.
-- ================================================
