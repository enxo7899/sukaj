-- ================================================
-- SUKAJ PRONA - AUTHENTICATION SETUP
-- ================================================
-- Run this script in Supabase SQL Editor to set up authentication
-- This will create users and assign roles

-- Step 1: Create Admin User
-- ================================================
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'sukaj@admin.com';

  -- If not exists, create it
  IF admin_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'sukaj@admin.com',
      crypt('Admin@2025!Sukaj', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      ''
    ) RETURNING id INTO admin_user_id;
    
    RAISE NOTICE 'Admin user created: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Admin user already exists: %', admin_user_id;
  END IF;

  -- Assign admin role
  INSERT INTO public.user_roles (user_id, email, role)
  VALUES (admin_user_id, 'sukaj@admin.com', 'admin')
  ON CONFLICT (user_id) DO UPDATE
  SET role = 'admin', email = 'sukaj@admin.com';
  
  RAISE NOTICE 'Admin role assigned';
END $$;

-- Step 2: Create Editor User
-- ================================================
DO $$
DECLARE
  editor_user_id uuid;
BEGIN
  -- Check if editor user already exists
  SELECT id INTO editor_user_id
  FROM auth.users
  WHERE email = 'sukaj@editor.com';

  -- If not exists, create it
  IF editor_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'sukaj@editor.com',
      crypt('Editor@2025!Sukaj', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      ''
    ) RETURNING id INTO editor_user_id;
    
    RAISE NOTICE 'Editor user created: %', editor_user_id;
  ELSE
    RAISE NOTICE 'Editor user already exists: %', editor_user_id;
  END IF;

  -- Assign editor role
  INSERT INTO public.user_roles (user_id, email, role)
  VALUES (editor_user_id, 'sukaj@editor.com', 'editor')
  ON CONFLICT (user_id) DO UPDATE
  SET role = 'editor', email = 'sukaj@editor.com';
  
  RAISE NOTICE 'Editor role assigned';
END $$;

-- Step 3: Verify Setup
-- ================================================
SELECT 
  u.email,
  ur.role,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email IN ('sukaj@admin.com', 'sukaj@editor.com')
ORDER BY u.email;

-- Expected output:
-- sukaj@admin.com  | admin  | true | [timestamp]
-- sukaj@editor.com | editor | true | [timestamp]

-- ================================================
-- If you see both users above, authentication is ready!
-- ================================================

-- Optional: Reset passwords (uncomment to use)
-- ================================================

-- Reset admin password
-- UPDATE auth.users
-- SET encrypted_password = crypt('NewPassword123!', gen_salt('bf')),
--     updated_at = now()
-- WHERE email = 'sukaj@admin.com';

-- Reset editor password
-- UPDATE auth.users
-- SET encrypted_password = crypt('NewPassword123!', gen_salt('bf')),
--     updated_at = now()
-- WHERE email = 'sukaj@editor.com';

-- ================================================
-- TROUBLESHOOTING
-- ================================================

-- Check if users exist
-- SELECT id, email, email_confirmed_at FROM auth.users 
-- WHERE email IN ('sukaj@admin.com', 'sukaj@editor.com');

-- Check if roles are assigned
-- SELECT * FROM public.user_roles;

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE tablename IN ('properties', 'rental_payments', 'user_roles');
