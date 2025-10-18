# 📧 Email Notification System - Setup Guide

## 🎯 Overview

Sistemi i njoftimeve automatike dërgon email në këto raste:

1. **3 ditë përpara** - Kujtesë e hershme
2. **1 ditë përpara** - Kujtesë urgjente
3. **Ditën e skadencës** - Qiraja duhet paguar sot
4. **1 ditë vonesë** - Qiraja është në vonesë (nëse ende Pa Paguar)

## 📋 Prerequisites

### 1. Email Service - Resend (Recommended)

**Pse Resend?**
- ✅ Falas deri në 3,000 email/muaj
- ✅ Email template te bukura
- ✅ API e thjeshtë
- ✅ Deliverability e lartë

**Krijimi i llogarisë:**

1. Shko në https://resend.com
2. Sign up me GitHub/Google
3. Verify email address
4. Add domain (opsionale) ose përdor `onboarding@resend.dev` për testing
5. Generate API Key:
   - Dashboard → API Keys
   - Create API Key
   - Copy key-in (duket vetëm një herë!)

### 2. Environment Variables

Shto këto në `.env.local`:

```env
# Resend API Key
RESEND_API_KEY=re_123abc...

# Owner email (ku dërgohen njoftimet)
OWNER_EMAIL=your-email@example.com

# Cron secret (për siguri)
CRON_SECRET=your-random-secret-here-minimum-32-chars

# Site URL
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

**Si të gjenerosh CRON_SECRET:**
```bash
# Mac/Linux
openssl rand -base64 32

# Or use online generator
# https://randomkeygen.com/
```

### 3. Install Dependencies

```bash
pnpm add resend
```

## 🚀 Deployment Options

### Option 1: Vercel Cron (Easiest - Recommended)

**Kur e përdorni:** Nëse aplikacioni është në Vercel

**Steps:**

1. File `vercel.json` është krijuar (ekziston në root)
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/send-notifications",
         "schedule": "0 8 * * *"
       }
     ]
   }
   ```

2. Push në GitHub dhe deploy në Vercel

3. Në Vercel Dashboard:
   - Settings → Environment Variables
   - Add: `RESEND_API_KEY`, `OWNER_EMAIL`, `CRON_SECRET`

4. Redeploy projektin

5. Verify në Vercel Dashboard → Cron Jobs
   - Shikon logs për çdo ekzekutim

**✅ Gati! Vercel ekzekuton automatikisht çdo ditë në 8:00 AM UTC (9:00 AM Albania time)**

---

### Option 2: GitHub Actions (Free Alternative)

**Kur e përdorni:** Nëse nuk jeni në Vercel ose dëshironi kontroll më të madh

**Steps:**

1. File `.github/workflows/send-notifications.yml` është krijuar

2. Në GitHub repo → Settings → Secrets and variables → Actions

3. Add secrets:
   - `APP_URL`: https://your-domain.com
   - `CRON_SECRET`: your-secret-from-env

4. Commit dhe push workflow file

5. Verify në Actions tab → Workflow duhet të ekzekutohet çdo ditë

**Testing manually:**
- Actions → Send Rent Notifications → Run workflow

---

### Option 3: External Cron Service

**Kur e përdorni:** Për reliability maksimale

**Services:**
- [cron-job.org](https://cron-job.org) - Free
- [EasyCron](https://www.easycron.com) - Free tier
- [Uptime Robot](https://uptimerobot.com) - Free monitoring + cron

**Setup me cron-job.org:**

1. Sign up në https://cron-job.org
2. Create new cron job:
   - **URL**: `https://your-domain.com/api/cron/send-notifications`
   - **Schedule**: `0 8 * * *` (daily at 8 AM)
   - **HTTP Headers**: 
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     ```
3. Save dhe activate

---

## 📅 Schedule Configuration

### Current Schedule: Daily at 8:00 AM UTC

**Cron expression:** `0 8 * * *`

**Albanian time:** 9:00 AM (UTC+1)

### To Change Schedule:

**Format:** `minute hour day month weekday`

Examples:
```bash
# Every day at 6:00 AM UTC (7:00 AM Albania)
0 6 * * *

# Every day at 10:00 AM UTC (11:00 AM Albania)
0 10 * * *

# Twice a day: 8 AM and 6 PM
0 8,18 * * *

# Only weekdays (Monday-Friday) at 8 AM
0 8 * * 1-5

# Every 6 hours
0 */6 * * *
```

Update në:
- `vercel.json` → crons[0].schedule
- `.github/workflows/send-notifications.yml` → schedule[0].cron

---

## 🧪 Testing

### Test Locally

Create test endpoint: `src/app/api/test-email/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { EmailService, generateReminderEmail } from '@/lib/email';

export async function GET() {
  const emailService = new EmailService();
  
  // Test with sample data
  const testProperties = [
    {
      id: '123',
      emertimi: 'Shkalla D Ap.D13',
      emri_qiraxhiut: 'Test User',
      tel_qiraxhiut: '+355123456',
      qera_mujore: 50000,
      monedha: 'ALL',
      data_qirase: '2025-11-01',
      status: 'Pa Paguar',
    },
  ];

  const html = generateReminderEmail(testProperties as any, 'due_today');
  
  const sent = await emailService.sendEmail({
    to: process.env.OWNER_EMAIL || 'test@example.com',
    subject: 'TEST: Email Notification',
    html,
    type: 'due_today',
  });

  return NextResponse.json({ success: sent });
}
```

Visit: `http://localhost:3001/api/test-email`

### Test Cron Job

**Local:**
```bash
curl -X GET "http://localhost:3001/api/cron/send-notifications" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Production:**
```bash
curl -X GET "https://your-domain.com/api/cron/send-notifications" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📊 Notification Types & Timing

| Type | When Sent | Example Scenario |
|------|-----------|-----------------|
| **reminder_3_days** | 3 days before due date | Due Nov 4 → Email Nov 1 |
| **reminder_1_day** | 1 day before due date | Due Nov 4 → Email Nov 3 |
| **due_today** | On the due date | Due Nov 4 → Email Nov 4 |
| **overdue_1_day** | 1 day after due date (if still unpaid) | Due Nov 4 → Email Nov 5 |

### Example Timeline:

```
Property: Shkalla D Ap.D13
Rent due: November 1, 2025
Status: Pa Paguar

Timeline:
Oct 29 (8 AM) → 📧 "Qiraja skadon pas 3 ditësh"
Oct 31 (8 AM) → 📧 "Qiraja skadon nesër"
Nov 1 (8 AM)  → 📧 "Qiraja duhet paguar sot"
Nov 2 (8 AM)  → 📧 "Qiraja është në vonesë" (if still Pa Paguar)
```

---

## 📧 Email Template

Emails përfshijnë:
- ✅ Header me branding
- ✅ Tabelë me të gjitha pronat që duhet njoftim
- ✅ Detaje: Prona, Qiraxhiu, Telefon, Shuma, Data
- ✅ Button për të hapur dashboard
- ✅ Professional footer

Preview: Check `src/lib/email.ts` → `generateReminderEmail()`

---

## 🗄️ Notification History

Të gjitha email-et e dërguara ruhen në database:

**Table:** `rent_notifications`

**Query example:**
```sql
-- Shiko të gjitha njoftimet e dërguara
SELECT 
  notification_type,
  property_name,
  tenant_name,
  payment_due_date,
  sent_at
FROM rent_notifications
ORDER BY sent_at DESC
LIMIT 20;

-- Sa email janë dërguar për një pronë
SELECT 
  property_name,
  COUNT(*) as total_notifications,
  MAX(sent_at) as last_notification
FROM rent_notifications
GROUP BY property_name
ORDER BY total_notifications DESC;
```

---

## 🔔 Weekly Summary (Optional Enhancement)

Për weekly summary email me të gjitha qirat e papaguara:

Add në `src/app/api/cron/send-notifications/route.ts`:

```typescript
// 5. Weekly summary (every Monday)
const dayOfWeek = today.getDay();
if (dayOfWeek === 1) { // Monday
  const allUnpaid = await getAllUnpaidProperties();
  
  if (allUnpaid.length > 0) {
    const html = generateReminderEmail(allUnpaid, 'weekly_summary');
    const sent = await emailService.sendEmail({
      to: ownerEmail,
      subject: '📊 Përmbledhje javore - Qirat e papaguara',
      html,
      type: 'weekly_summary',
    });
    
    if (sent) {
      await logNotifications(allUnpaid, 'weekly_summary', ownerEmail);
      notifications.push({ type: 'weekly_summary', count: allUnpaid.length });
    }
  }
}
```

---

## 🛠️ Troubleshooting

### Emails not being sent?

1. **Check API Key:**
   ```bash
   # In project root
   echo $RESEND_API_KEY
   # Should show: re_...
   ```

2. **Check Vercel Logs:**
   - Vercel Dashboard → Project → Functions
   - Find `/api/cron/send-notifications`
   - Check logs for errors

3. **Test Resend API directly:**
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "onboarding@resend.dev",
       "to": "your@email.com",
       "subject": "Test",
       "html": "<p>Test email</p>"
     }'
   ```

4. **Check notification history:**
   ```sql
   SELECT * FROM rent_notifications 
   WHERE email_sent_successfully = false;
   ```

### Cron not running?

1. **Vercel:** Check Cron Jobs page in dashboard
2. **GitHub Actions:** Check Actions tab for failed workflows
3. **External service:** Check service logs

### Wrong timezone?

Cron runs in UTC. Albania is UTC+1 (UTC+2 in summer).

To run at 9 AM Albania time:
- Winter: `0 8 * * *` (UTC)
- Summer: `0 7 * * *` (UTC)

---

## 💰 Pricing

### Resend
- **Free:** 3,000 emails/month, 100/day
- **Paid:** $20/month for 50,000 emails

### Vercel Cron
- **Free** on all plans
- Included with Vercel hosting

### GitHub Actions
- **Free** for public repos
- 2,000 minutes/month for private repos

---

## 🚀 Next Steps

1. ✅ Set up Resend account
2. ✅ Add environment variables
3. ✅ Deploy to Vercel (or configure GitHub Actions)
4. ✅ Test with `/api/test-email` endpoint
5. ✅ Monitor first automated run
6. ✅ Adjust schedule if needed

---

## 📞 Support

For issues:
1. Check Vercel logs
2. Check Resend dashboard
3. Query `rent_notifications` table for history

**Email notifications active!** 🎉
