-- ================================================
-- AUTHENTICATION & ROLES SETUP
-- ================================================
-- Run this FIRST before creating users!

-- Step 1: Create user_roles table
-- ================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'editor')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON public.user_roles(email);

-- Step 2: Enable Row Level Security
-- ================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies for user_roles
-- ================================================

-- Policy: Users can read their own role
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 4: Update RLS Policies for properties table
-- ================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin full access to properties" ON public.properties;
DROP POLICY IF EXISTS "Editor can view properties" ON public.properties;
DROP POLICY IF EXISTS "Editor can update property status" ON public.properties;

-- Admin: Full access
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
  );

-- Editor: Can view all properties
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

-- Editor: Can only update status field
CREATE POLICY "Editor can update property status"
  ON public.properties
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'editor'
    )
  );

-- Step 5: Update RLS Policies for rental_payments table
-- ================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin full access to rental_payments" ON public.rental_payments;
DROP POLICY IF EXISTS "Editor can view rental_payments" ON public.rental_payments;

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

-- Step 6: Update RLS Policies for rent_notifications table
-- ================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view notifications" ON public.rent_notifications;

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

-- Step 7: Create function to update updated_at timestamp
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to user_roles table
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- VERIFICATION
-- ================================================

-- Check if table exists
SELECT 
  schemaname, 
  tablename, 
  tableowner 
FROM pg_tables 
WHERE tablename = 'user_roles';

-- Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('user_roles', 'properties', 'rental_payments', 'rent_notifications');

-- Check policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('user_roles', 'properties', 'rental_payments', 'rent_notifications')
ORDER BY tablename, policyname;

-- ================================================
-- SUCCESS!
-- ================================================
-- If you see the user_roles table and policies above,
-- you can now run setup-auth.sql to create users!
-- ================================================
