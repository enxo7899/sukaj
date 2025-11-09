# 🧪 SMS TEST TODAY AT 4 PM ALBANIA TIME

**Date:** Nov 4, 2025  
**Current Time:** 12:31 PM UTC (1:31 PM Albania)  
**Test Time:** 3:00 PM UTC (4:00 PM Albania)  
**Time Until Test:** ~2.5 hours

---

## ✅ Setup Complete

### 1. Cron Job Updated
- **Old Schedule:** `0 8 * * *` (9 AM Albania)
- **New Schedule:** `0 15 * * *` (4 PM Albania)
- **Status:** ✅ Active

### 2. Test Properties Set
**2 properties with rent due TODAY (Nov 4):**

| Property | Tenant | Tenant Phone | Owner Phone | Rent Due |
|----------|--------|--------------|-------------|----------|
| Shkalla B Ap.B2 | ROVENA SUKAJ | +355695581889 | +355692515441 | Nov 4 |
| Shkalla D Ap.D10 | ROVENA SUKAJ | +355692515441 | +355692515441 | Nov 4 |

### 3. Expected SMS at 4 PM Albania
**3 SMS messages will be sent:**

1. **Tenant SMS #1** → +355695581889 (ROVENA SUKAJ for Shkalla B Ap.B2)
2. **Tenant SMS #2** → +355692515441 (ROVENA SUKAJ for Shkalla D Ap.D10)
3. **Owner SMS (Consolidated)** → +355692515441 (listing BOTH properties)

**Your daughter's phone (+355692515441) will receive 3 messages total:**
- 1 as tenant (for Shkalla D Ap.D10)
- 1 owner summary (listing both properties)
- (The other tenant SMS goes to +355695581889)

---

## ⏰ Timeline

**12:31 PM UTC (Now)** - Setup complete  
**↓ Wait 2.5 hours**  
**3:00 PM UTC (4:00 PM Albania)** - Cron triggers  
**↓ Within 10 seconds**  
**SMS delivered** - Check phones!

---

## 🔍 How to Verify (After 4 PM Albania)

### Step 1: Check Phone
**Phone: +355692515441** should receive **3 SMS messages**

### Step 2: Check Cron Logs
```sql
SELECT 
  status,
  return_message,
  start_time
FROM cron.job_run_details 
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'send-rent-sms-daily')
ORDER BY start_time DESC 
LIMIT 1;
```
**Expected:** `status = 'succeeded'`

### Step 3: Check HTTP Response
```sql
SELECT 
  status_code,
  content::text
FROM net._http_response
ORDER BY id DESC
LIMIT 1;
```
**Expected:** `status_code = 200`, content shows `"properties_processed":2`

### Step 4: Check Payment Records
```sql
SELECT 
  property_name,
  tenant_name,
  tenant_phone,
  rent_amount,
  created_at
FROM rental_payments 
WHERE created_at::date = CURRENT_DATE
ORDER BY created_at DESC;
```
**Expected:** 2 new records created at ~3 PM UTC

### Step 5: Check Twilio Logs
Go to: https://console.twilio.com/us1/monitor/logs/sms  
Filter by: Nov 4, 2025, around 3:00 PM UTC  
**Expected:** 3 messages with status "delivered"

---

## ✅ After Test Succeeds

### Change Cron Back to 9 AM Albania:

```sql
-- Delete test schedule
SELECT cron.unschedule('send-rent-sms-daily');

-- Create production schedule (9 AM Albania = 8 AM UTC)
SELECT cron.schedule(
  'send-rent-sms-daily',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://spjyoppunobbtcviqiwg.supabase.co/functions/v1/send-rent-sms',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwanlvcHB1bm9iYnRjdmlxaXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NTYxNTUsImV4cCI6MjA3NjMzMjE1NX0.0bAqqqadWEJK5ZOkPCoGpFES5G-MaC2g8yTmoSCl-OU"}'::jsonb
    ) AS request_id;
  $$
);

-- Verify
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'send-rent-sms-daily';
```

---

## 🎯 What This Test Proves

If successful, this proves:
- ✅ Cron job triggers correctly
- ✅ Edge Function processes properties
- ✅ SMS are sent via Twilio
- ✅ Payment records are created
- ✅ Owner messages are consolidated (1 SMS for 2 properties)
- ✅ The 401 JWT issue is fixed

---

## 📱 Expected SMS Content

### Tenant SMS (to +355695581889):
```
Përshëndetje ROVENA SUKAJ,
Dëshirojmë t'ju kujtojmë për kryerjen e pagesës së qirasë 
për muajin aktual për pronën Shkalla B Ap.B2.
Ju faleminderit për bashkëpunimin dhe mirëkuptimin!
Me respekt,
Lindita Sukaj
```

### Tenant SMS (to +355692515441):
```
Përshëndetje ROVENA SUKAJ,
Dëshirojmë t'ju kujtojmë për kryerjen e pagesës së qirasë 
për muajin aktual për pronën Shkalla D Ap.D10.
Ju faleminderit për bashkëpunimin dhe mirëkuptimin!
Me respekt,
Lindita Sukaj
```

### Owner SMS (to +355692515441):
```
Kujtesë: 2 qira përfundonë sot:

1. Shkalla B Ap.B2
   Qiramarrës: ROVENA SUKAJ
   Tel: +355695581889
   Shuma: [amount] [currency]

2. Shkalla D Ap.D10
   Qiramarrës: ROVENA SUKAJ
   Tel: +355692515441
   Shuma: [amount] [currency]

- Sukaj SHPK
```

---

## 🚨 If Test Fails

### Manual Trigger:
```bash
curl -X POST "https://spjyoppunobbtcviqiwg.supabase.co/functions/v1/send-rent-sms" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwanlvcHB1bm9iYnRjdmlxaXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NTYxNTUsImV4cCI6MjA3NjMzMjE1NX0.0bAqqqadWEJK5ZOkPCoGpFES5G-MaC2g8yTmoSCl-OU" \
  -H "Content-Type: application/json"
```

This will immediately send SMS for today's rent due properties.

---

## 📊 Current Status

| Check | Status | Details |
|-------|--------|---------|
| Cron Schedule | ✅ Set | `0 15 * * *` (4 PM Albania) |
| Properties Ready | ✅ 2 | Both with rent due Nov 4 |
| Edge Function | ✅ Fixed | Returns 200 (not 401) |
| JWT Issue | ✅ Resolved | Deployed with --no-verify-jwt |
| Test Phone | ✅ Set | +355692515441 |
| Current Time | 12:31 UTC | Test runs at 15:00 UTC |

---

**🎯 Test runs in ~2.5 hours at 4:00 PM Albania time!**

**After success, don't forget to change cron back to 9 AM!**
