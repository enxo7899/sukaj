# 🎉 Sukaj Prona - Complete Setup Guide

## Overview

Your rental property management dashboard is now complete with all features:

✅ Property CRUD operations  
✅ Payment history tracking  
✅ Email notifications  
✅ Role-based authentication  
✅ Beautiful Albanian UI  

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd /Users/enxom/Desktop/Sukaj/rental-dashboard
pnpm install
```

### 2. Environment Variables

Make sure `.env.local` has:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://spjyoppunobbtcviqiwg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key

# Email (Resend)
RESEND_API_KEY=re_your_key
OWNER_EMAIL=your@email.com

# Security
CRON_SECRET=your-random-32-char-secret

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### 3. Create Users in Supabase

Go to Supabase Dashboard → Authentication → Users

**Admin User:**
- Email: `sukaj@admin.com`
- Password: `Admin@2025!Sukaj`
- Auto-confirm: Yes

**Editor User:**
- Email: `sukaj@editor.com`  
- Password: `Editor@2025!Sukaj`
- Auto-confirm: Yes

### 4. Assign Roles

Run in Supabase SQL Editor:

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

### 5. Run Application

```bash
pnpm dev
```

Visit: http://localhost:3001

---

## 📚 System Features

### 🔐 Authentication

**Login:** http://localhost:3001/login

**Admin Access** (`sukaj@admin.com`):
- Create, edit, delete properties
- Change property status
- View payment history
- Receive email notifications

**Editor Access** (`sukaj@editor.com`):
- View all properties
- Change status only (Paguar/Pa Paguar)
- View payment history

### 🏢 Property Management

**Properties Table:**
- Search by name or tenant
- Filter by group (6 KATESHI, Shkalla, etc.)
- Sort automatically (apartments first)
- CRUD operations (admin only)

**Property Fields:**
- Emërtimi (name)
- Grupi (group category)
- Shkalla (level: A, B, D)
- Qiraxhiu (tenant name)
- Telefon (phone)
- OSHEE code
- UKT code
- Qera mujore (monthly rent)
- Monedha (EUR/ALL/USD)
- Data e qirasë (rent due date)
- Status (Paguar/Pa Paguar)

### 📊 Payment Tracking

**History Table:** `rental_payments`

Tracks:
- Every status change
- Tenant at time of payment
- Rent amount
- Payment date
- Property details

**Query Examples:**

```sql
-- Who rented Ap.D13 in November 2025?
SELECT * FROM rental_payments
WHERE property_name = 'Shkalla D Ap.D13'
  AND payment_due_date BETWEEN '2025-11-01' AND '2025-11-30';

-- All payments by tenant
SELECT * FROM rental_payments
WHERE tenant_name ILIKE '%Artur Cami%'
ORDER BY payment_due_date DESC;
```

### 📧 Email Notifications

**Automatic Reminders:**
- 3 days before rent due
- 1 day before rent due
- On rent due date
- 1 day after (if unpaid)

**Setup:**
1. Sign up at https://resend.com
2. Get API key
3. Add to `.env.local`
4. Deploy with Vercel (auto-cron) or GitHub Actions

**Test Email:**
```bash
curl http://localhost:3001/api/cron/send-notifications \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📱 UI Navigation

### Sidebar Menu

- **Kreu** - Home/Dashboard
- **Të gjitha apartamentet** - All apartments combined
  - 6 KATESHI I BARDHË (9 properties)
  - Shkalla A+B (18 properties)
  - Shkalla D (36 properties)
- **Ambjentet e mëdha** ▼ (collapsible)
  - Magazina (7 properties)
  - Dyqane (2 properties)
  - Hoteli (1 property)
- **Të gjitha pronat** - All properties list

### Status Workflow

**Scenario:**
1. Property has rent due November 1
2. Status: Pa Paguar (red badge)
3. Owner clicks status → Selects "Paguar"
4. System automatically:
   - Marks as Paguar (green badge)
   - Moves date to December 1
   - Records payment in history
5. Next month, status resets to "Pa Paguar"

---

## 🗄️ Database Schema

### Tables

**properties** - Main property data (74 records)
**rental_payments** - Payment history
**rent_notifications** - Email log
**user_roles** - User permissions

### Row Level Security (RLS)

**Admin:**
- Full access to all tables

**Editor:**
- Can read everything
- Can only update `status` field in properties

---

## 📖 Documentation Files

- **README.md** - Project overview
- **CHANGELOG.md** - Version history
- **PAYMENT_HISTORY_GUIDE.md** - SQL queries for reports
- **EMAIL_NOTIFICATIONS_SETUP.md** - Email system setup
- **AUTHENTICATION_SETUP.md** - User & role setup
- **FINAL_SETUP_GUIDE.md** - This file

---

## 🔧 Development

### File Structure

```
rental-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout with auth
│   │   ├── page.tsx                      # Home page
│   │   ├── login/                        # Login page
│   │   ├── prona/                        # Properties CRUD
│   │   └── api/cron/send-notifications/  # Email cron
│   ├── components/
│   │   ├── sidebar.tsx                   # Navigation with logout
│   │   └── ui/                           # shadcn components
│   ├── contexts/
│   │   └── auth-context.tsx              # Auth state management
│   ├── lib/
│   │   ├── supabase.ts                   # Client
│   │   ├── supabase-server.ts            # Server
│   │   ├── supabase-client.ts            # Browser
│   │   ├── email.ts                      # Email templates
│   │   └── utils.ts                      # Utilities
│   ├── types/
│   │   └── property.ts                   # TypeScript types
│   └── middleware.ts                     # Route protection
├── sql/
│   └── migrations/                       # Database migrations
├── scripts/
│   └── import-listings.ts                # Excel import
└── data/
    └── listings.xlsx                     # Property data
```

### Tech Stack

- Next.js 15 (App Router)
- Supabase (PostgreSQL + Auth)
- Tailwind CSS 4
- shadcn/ui
- TypeScript
- React Hook Form + Zod
- Resend (emails)

---

## 🐛 Troubleshooting

### Can't login?

```sql
-- Confirm user email
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'sukaj@admin.com';

-- Check role assigned
SELECT * FROM user_roles WHERE email = 'sukaj@admin.com';
```

### No properties showing?

```sql
-- Check data exists
SELECT COUNT(*) FROM properties;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'properties';
```

### Emails not sending?

1. Check Resend API key in `.env.local`
2. Verify owner email is correct
3. Test with `/api/test-email` endpoint
4. Check Resend dashboard for errors

### Hydration errors?

Clear browser cache and restart dev server.

---

## 🚀 Production Deployment

### Checklist

1. ✅ Change default passwords
2. ✅ Add environment variables to Vercel
3. ✅ Enable email confirmation in Supabase
4. ✅ Configure custom domain
5. ✅ Set up Vercel Cron
6. ✅ Test both user roles
7. ✅ Verify email notifications
8. ✅ Check RLS policies

### Vercel Deployment

```bash
# Connect to Vercel
vercel

# Add environment variables in dashboard
# Deploy
vercel --prod
```

---

## 📊 Current Statistics

- **Total Properties:** 74
- **Apartments:** 63 (6 KATESHI + Shkalla A+B + Shkalla D)
- **Other:** 11 (MAGAZINA + DYQANE + HOTELI + AMBJENTET)
- **Users:** 2 (1 admin, 1 editor)
- **Payment Records:** 74 (initial migration)

---

## 🎯 Future Enhancements

Ideas for future versions:

- 📊 Dashboard with charts
- 💰 Revenue reports
- 📄 PDF export
- 📧 Custom email templates
- 👥 More user roles
- 📱 Mobile app
- 🔔 Push notifications
- 📸 Property photos
- 📝 Tenant contracts
- 💳 Payment tracking per tenant

---

## 💡 Tips

1. **Regular backups:** Export database monthly
2. **Password rotation:** Change passwords every 90 days
3. **Monitor emails:** Check Resend dashboard weekly
4. **Review payments:** Query `rental_payments` for insights
5. **Test logins:** Periodically verify both admin and editor access

---

## 📞 Quick Reference

**Default Credentials:**

| Email | Password | Role |
|-------|----------|------|
| sukaj@admin.com | Admin@2025!Sukaj | Admin |
| sukaj@editor.com | Editor@2025!Sukaj | Editor |

⚠️ **CHANGE IN PRODUCTION!**

**URLs:**
- Local: http://localhost:3001
- Login: http://localhost:3001/login
- API: http://localhost:3001/api/cron/send-notifications

**Database:**
- Supabase: https://supabase.com/dashboard
- Project: spjyoppunobbtcviqiwg

---

## ✅ You're All Set!

Your rental property management system is production-ready with:

✅ Secure authentication  
✅ Role-based access control  
✅ Complete CRUD operations  
✅ Payment history tracking  
✅ Automated email reminders  
✅ Beautiful Albanian interface  
✅ Mobile responsive design  

**Happy property managing!** 🏢🎉

---

**© 2025 Sukaj Properties | Built with ❤️ using Next.js & Supabase**
