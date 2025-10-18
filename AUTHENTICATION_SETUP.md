# 🔐 Authentication Setup Guide

## Overview

The rental dashboard now has role-based authentication with two user types:
- **Admin** (`sukaj@admin.com`) - Full CRUD access
- **Editor** (`sukaj@editor.com`) - Can only change property status (Paguar/Pa Paguar)

## 📋 Prerequisites

Install required dependencies:

```bash
pnpm add @supabase/ssr @supabase/supabase-js
```

## 🚀 Setup Steps

### Step 1: Enable Email Auth in Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **Email** provider
3. Configure email templates (optional)
4. **Disable** email confirmation for easier setup:
   - Settings → Authentication → Email Auth
   - Uncheck "Enable email confirmations"

### Step 2: Create Users in Supabase

#### Option A: Using Supabase Dashboard (Easiest)

1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**

**Create Admin User:**
- Email: `sukaj@admin.com`
- Password: `Admin@2025!Sukaj` (or your choice)
- Auto-confirm: ✅ Yes
- Click **Create user**

**Create Editor User:**
- Email: `sukaj@editor.com`
- Password: `Editor@2025!Sukaj` (or your choice)
- Auto-confirm: ✅ Yes
- Click **Create user**

#### Option B: Using SQL (Alternative)

Run this in Supabase SQL Editor:

```sql
-- Create admin user
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
  crypt('Admin@2025!Sukaj', gen_salt('bf')), -- Change password here
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  ''
);

-- Create editor user  
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
  crypt('Editor@2025!Sukaj', gen_salt('bf')), -- Change password here
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  ''
);
```

### Step 3: Assign Roles

After creating users, you need to assign them roles in the `user_roles` table.

**Get User IDs:**

```sql
SELECT id, email FROM auth.users 
WHERE email IN ('sukaj@admin.com', 'sukaj@editor.com');
```

**Insert Roles:**

```sql
-- Assign admin role
INSERT INTO public.user_roles (user_id, email, role)
SELECT id, 'sukaj@admin.com', 'admin'
FROM auth.users 
WHERE email = 'sukaj@admin.com';

-- Assign editor role
INSERT INTO public.user_roles (user_id, email, role)
SELECT id, 'sukaj@editor.com', 'editor'
FROM auth.users 
WHERE email = 'sukaj@editor.com';
```

**Verify roles:**

```sql
SELECT 
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY u.email;
```

Should return:
```
sukaj@admin.com  | admin  | 2025-10-18...
sukaj@editor.com | editor | 2025-10-18...
```

### Step 4: Test Login

1. Start development server:
   ```bash
   pnpm dev
   ```

2. Visit http://localhost:3001
3. You'll be redirected to `/login`
4. Test admin login:
   - Email: `sukaj@admin.com`
   - Password: `Admin@2025!Sukaj`
5. You should see full functionality (add, edit, delete buttons)
6. Logout and test editor login:
   - Email: `sukaj@editor.com`
   - Password: `Editor@2025!Sukaj`
7. You should only see status change dropdown, no edit/delete buttons

## 🔑 Changing Passwords

### Via Supabase Dashboard

1. Authentication → Users
2. Click on user
3. Click **Reset password**
4. Set new password

### Via SQL

```sql
-- Change admin password
UPDATE auth.users
SET encrypted_password = crypt('NewPassword123!', gen_salt('bf')),
    updated_at = now()
WHERE email = 'sukaj@admin.com';

-- Change editor password
UPDATE auth.users
SET encrypted_password = crypt('NewPassword123!', gen_salt('bf')),
    updated_at = now()
WHERE email = 'sukaj@editor.com';
```

## 👥 Adding More Users (Future)

To add more users:

1. Create user in Supabase Authentication
2. Insert role in `user_roles` table:

```sql
-- For a new admin
INSERT INTO public.user_roles (user_id, email, role)
SELECT id, 'newadmin@example.com', 'admin'
FROM auth.users 
WHERE email = 'newadmin@example.com';

-- For a new editor
INSERT INTO public.user_roles (user_id, email, role)
SELECT id, 'neweditor@example.com', 'editor'
FROM auth.users 
WHERE email = 'neweditor@example.com';
```

## 🛡️ Security Features

### Row Level Security (RLS)

The following tables have RLS enabled:

#### `properties` Table

**Admin:**
- ✅ Can SELECT, INSERT, UPDATE, DELETE

**Editor:**
- ✅ Can SELECT (read all properties)
- ✅ Can UPDATE (but only status field - enforced by app logic)
- ❌ Cannot INSERT or DELETE

#### `rental_payments` Table

**Admin:**
- ✅ Full access

**Editor:**
- ✅ Can SELECT (read payment history)
- ❌ Cannot INSERT, UPDATE, or DELETE

#### `rent_notifications` Table

**Both:**
- ✅ Can SELECT (read notifications)

### Route Protection

All routes except `/login` are protected by middleware:
- Unauthenticated users → Redirected to `/login`
- Authenticated users → Access granted based on role

## 📱 UI Differences

### Admin View
- ✅ "Shto pronë" button visible
- ✅ Edit icon (pencil) for each property
- ✅ Delete icon (trash) for each property
- ✅ Can change all fields in edit dialog
- ✅ Status dropdown for changing Paguar/Pa Paguar

### Editor View
- ❌ No "Shto pronë" button
- ❌ No edit/delete icons
- ✅ Status dropdown (only way to interact)
- ℹ️ Message: "Vetëm admin mund të ndryshojë"

## 🔍 Troubleshooting

### "Email not confirmed" error

Disable email confirmation:
1. Supabase Dashboard → Authentication → Settings
2. Scroll to "Email Auth"
3. Uncheck "Enable email confirmations"

### User can't log in

```sql
-- Check if user exists
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'sukaj@admin.com';

-- Confirm email if needed
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'sukaj@admin.com';
```

### User has no role

```sql
-- Check role assignment
SELECT * FROM public.user_roles WHERE email = 'sukaj@admin.com';

-- If missing, assign role
INSERT INTO public.user_roles (user_id, email, role)
SELECT id, 'sukaj@admin.com', 'admin'
FROM auth.users 
WHERE email = 'sukaj@admin.com';
```

### RLS blocking queries

Check RLS policies are enabled:

```sql
-- Check if policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('properties', 'rental_payments');

-- If missing, re-run the migration
-- File: sql/migrations/create_auth_and_roles.sql
```

## 📊 Monitoring

### Check active sessions

```sql
SELECT 
  u.email,
  ur.role,
  s.created_at as session_started
FROM auth.sessions s
JOIN auth.users u ON u.id = s.user_id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY s.created_at DESC;
```

### Check user activity

```sql
SELECT 
  ur.email,
  ur.role,
  COUNT(rp.id) as actions_taken
FROM public.user_roles ur
LEFT JOIN public.rental_payments rp ON rp.property_id IN (
  SELECT id FROM properties
)
GROUP BY ur.email, ur.role;
```

## 🔐 Best Practices

1. **Strong Passwords**: Use passwords with:
   - Minimum 12 characters
   - Uppercase and lowercase letters
   - Numbers
   - Special characters

2. **Regular Password Changes**: Change passwords every 90 days

3. **Audit Logs**: Monitor `rental_payments` and `rent_notifications` tables for user activity

4. **Principle of Least Privilege**: Only give admin access to users who absolutely need it

5. **Session Management**: Users are automatically logged out after inactivity (handled by Supabase)

## 🚀 Production Deployment

Before deploying:

1. ✅ Change default passwords
2. ✅ Enable email confirmation in production
3. ✅ Set up proper email templates in Supabase
4. ✅ Configure proper SMTP settings
5. ✅ Add environment variables to hosting platform
6. ✅ Test both admin and editor logins thoroughly

---

## 📞 Quick Reference

**Default Credentials:**

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `sukaj@admin.com` | `Admin@2025!Sukaj` | admin | Full CRUD |
| `sukaj@editor.com` | `Editor@2025!Sukaj` | editor | Status only |

**⚠️ CHANGE THESE PASSWORDS IMMEDIATELY IN PRODUCTION!**

---

**Authentication system is ready!** 🎉🔐
