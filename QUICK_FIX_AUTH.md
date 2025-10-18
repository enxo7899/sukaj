# 🔧 Quick Fix for Authentication Issue

## Problem
- Authentication failing
- Sidebar showing on login page

## ✅ Solutions Applied

### 1. **Sidebar Issue - FIXED** ✅
- Created `ConditionalLayout` component that hides sidebar on login page
- Login page now shows clean full-screen design

### 2. **Authentication Issue - Follow These Steps** 🔐

## Step-by-Step Fix

### **STEP 1: Check Environment Variables**

Make sure `/Users/enxom/Desktop/Sukaj/rental-dashboard/.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://spjyoppunobbtcviqiwg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

⚠️ **If these are missing or wrong, authentication WILL NOT WORK.**

---

### **STEP 2: Run SQL Setup Script**

1. Open **Supabase Dashboard**: https://supabase.com/dashboard/project/spjyoppunobbtcviqiwg
2. Go to **SQL Editor**
3. Copy the entire content of `sql/setup-auth.sql`
4. Paste and **Run** it
5. You should see output like:
   ```
   sukaj@admin.com  | admin  | true
   sukaj@editor.com | editor | true
   ```

This script will:
- ✅ Create both users (admin + editor)
- ✅ Set passwords
- ✅ Confirm emails automatically
- ✅ Assign roles

---

### **STEP 3: Verify in Browser**

1. **Open app**: http://localhost:3001
2. You should be redirected to **login page** (no sidebar!)
3. Try logging in with:
   - Email: `sukaj@admin.com`
   - Password: `Admin@2025!Sukaj`
4. You should:
   - ✅ See success toast
   - ✅ Redirect to home
   - ✅ See sidebar with your email at top
   - ✅ See "Dil" (logout) button at bottom

---

## 🔍 If Still Not Working

### Check 1: Are users created?

Run in Supabase SQL Editor:
```sql
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email IN ('sukaj@admin.com', 'sukaj@editor.com');
```

Should return 2 rows.

### Check 2: Are roles assigned?

```sql
SELECT * FROM public.user_roles;
```

Should return 2 rows with roles.

### Check 3: Check browser console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try logging in
4. Look for error messages

Common errors:
- **"Invalid login credentials"** → Users not created or wrong password
- **"Unable to validate token"** → Wrong Supabase URL/Key in .env.local
- **"Failed to fetch"** → Supabase project paused or deleted

### Check 4: Supabase Auth Settings

1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Go to **Authentication** → **URL Configuration**
4. Site URL should be: `http://localhost:3001`

---

## 🎯 Quick Test Commands

### Test 1: Check if server is running
```bash
curl http://localhost:3001
```

### Test 2: Check if Supabase is accessible
```bash
curl https://spjyoppunobbtcviqiwg.supabase.co/rest/v1/
```

Should not return error.

---

## 📋 Credentials Reference

| Email | Password | Role |
|-------|----------|------|
| `sukaj@admin.com` | `Admin@2025!Sukaj` | Admin |
| `sukaj@editor.com` | `Editor@2025!Sukaj` | Editor |

---

## 🚀 After Successful Login

**Admin View:**
- ✅ Can see all properties
- ✅ Can add new property
- ✅ Can edit/delete any property
- ✅ Can change status

**Editor View:**
- ✅ Can see all properties
- ✅ Can change status ONLY
- ❌ Cannot add/edit/delete

---

## ⚡ Still Having Issues?

### Nuclear Option: Reset Everything

1. **Delete users in Supabase Dashboard:**
   - Authentication → Users → Delete both users

2. **Clear roles:**
   ```sql
   DELETE FROM public.user_roles;
   ```

3. **Re-run setup script:**
   - Copy all of `sql/setup-auth.sql`
   - Run in SQL Editor

4. **Restart dev server:**
   ```bash
   # Kill existing server
   lsof -ti:3001 | xargs kill -9
   
   # Start fresh
   pnpm dev
   ```

5. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Delete → Clear all
   - Or use Incognito mode

---

## ✅ Success Checklist

When everything works, you should:

- [ ] See login page WITHOUT sidebar
- [ ] Be able to login with admin credentials
- [ ] See home page WITH sidebar after login
- [ ] See your email at top of sidebar
- [ ] See "Dil" logout button at bottom
- [ ] Be able to add/edit properties (admin)
- [ ] Be able to logout successfully
- [ ] Be redirected to login after logout

---

**If you complete the SQL setup and still have issues, check the browser console for specific error messages.**
