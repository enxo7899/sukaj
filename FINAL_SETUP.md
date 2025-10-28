# ✅ FINAL SETUP - Test at 8:20 PM

## 🎯 Test Property Created

- **Name:** Test Property 28
- **Tenant phone:** +355692515441
- **Owner phone:** +355692515441
- **Due date:** TODAY (2025-10-28)
- **Status:** Pa Paguar

Only THIS property will be processed (due today + status "Pa Paguar").

---

## ⏰ Schedule

**8:20 PM UTC** → Process rent (save to database)  
**8:21 PM UTC** → Send SMS to +355692515441

---

## 🔑 CRITICAL: Add Environment Variables to Vercel

### 1. Go to Vercel
https://vercel.com/dashboard → Your project → Settings → Environment Variables

### 2. Add ALL These Variables

From Supabase (https://supabase.com/dashboard → Project → Settings → API):
```
NEXT_PUBLIC_SUPABASE_URL=https://spjyoppunobbtcviqiwg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwanlvcHB1bm9iYnRjdmlxaXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NTYxNTUsImV4cCI6MjA3NjMzMjE1NX0.0bAqqqadWEJK5ZOkPCoGpFES5G-MaC2g8yTmoSCl-OU
SUPABASE_SERVICE_ROLE_KEY=<GET FROM SUPABASE>
```

From Twilio (https://console.twilio.com):
```
TWILIO_ACCOUNT_SID=<YOUR ACCOUNT SID>
TWILIO_AUTH_TOKEN=<YOUR AUTH TOKEN>
TWILIO_MSG_SERVICE_SID=<YOUR MESSAGING SERVICE SID>
```

Optional:
```
ALPHA_SENDER_NAME=Sukaj SHPK
USE_ALPHANUMERIC_SENDER=true
```

### 3. For Each Variable:
- Click "Add New"
- Name: (e.g., `TWILIO_ACCOUNT_SID`)
- Value: (paste the value)
- Environment: Check ALL (Production, Preview, Development)
- Click "Save"

### 4. After Adding All Variables
- Go to Deployments tab
- Click the latest deployment
- Click ⋯ (three dots) → "Redeploy"
- Wait 2-3 minutes

---

## 📱 Expected Result

At 8:20-8:21 PM, phone +355692515441 should receive **2 SMS**:

**SMS 1 (Tenant):**
```
Përshëndetje Test User, ju rikujtojmë se qiraja 
për pronën Test Property 28 përfundon sot. 
Shuma: 100 EUR. Ju lutemi të kryeni pagesën. 
Faleminderit!
```

**SMS 2 (Owner):**
```
Kujtesë: 1 qira përfundon sot:

1. Test Property 28
Qiramarrës: Test User
Tel: +355692515441
Shuma: 100 EUR

- Sukaj Properties
```

---

## 🔍 Verify

### Vercel Logs (at 8:20 PM):
https://vercel.com/dashboard → Your project → Logs
- Look for `/api/cron/process-rent-due` 
- Look for `/api/sms/rent-due`
- Should show successful execution

### Twilio Logs:
https://console.twilio.com/us1/monitor/logs/sms
- Should show 2 messages sent
- Both to +355692515441
- Status: "delivered"

---

## 🧹 After Test

```sql
DELETE FROM properties WHERE emertimi = 'Test Property 28';
```

Then update `vercel.json` to normal schedule (5 AM and 6 AM UTC) and push again.

---

## 💰 Cost

**$0.10** (2 SMS)

---

## ⚠️ Important

**The SMS will ONLY work if:**
1. ✅ All environment variables are in Vercel
2. ✅ Vercel deployment completed successfully
3. ✅ It's exactly 8:20-8:21 PM UTC

**Deployment is happening now. Test runs at 8:20 PM!** 🚀
