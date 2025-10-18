# Payment History System - Guide për Raporte

## 📊 Overview

Sistemi i historikut të pagesave ruan të gjitha ndryshimet e statusit të qirave për të mundësuar raporte të detajuara në të ardhmen.

## 🗄️ Database: `rental_payments` Table

Çdo herë që ndryshon statusi i një prone, një rekord i ri krijohet në tabelën `rental_payments` që ruan:

- **property_id**: ID e pronës
- **property_name**: Emërtimi (p.sh. "Shkalla D Ap.D13")
- **tenant_name**: Emri i qiraxhiut në atë moment
- **tenant_phone**: Numri i telefonit
- **rent_amount**: Shuma e qirasë
- **currency**: Monedha (EUR, ALL, USD)
- **payment_due_date**: Data kur duhej paguar qiraja
- **status**: Paguar ose Pa Paguar
- **paid_at**: Timestamp kur u shënua si Paguar
- **grupi**: Grupi i pronës (6 KATESHI I BARDHË, Shkalla A+B, etj.)
- **shkalla**: Shkalla (A, B, D)
- **notes**: Shënime shtesë
- **created_at**: Kur u krijua rekordi
- **updated_at**: Kur u përditësua

## 🔍 Example Queries për Raporte

### 1. Kush kishte një pronë specifike në një muaj të caktuar?

**Pyetja juaj**: "Kush kishte Shkalla D Ap.D13 në Nëntor 2025?"

```sql
SELECT 
  property_name,
  tenant_name,
  tenant_phone,
  payment_due_date,
  status,
  rent_amount,
  currency,
  paid_at
FROM rental_payments 
WHERE property_name = 'Shkalla D Ap.D13'
  AND payment_due_date >= '2025-11-01'
  AND payment_due_date <= '2025-11-30'
ORDER BY payment_due_date;
```

### 2. Të gjitha pagesat e një qiraxhiu specifik

```sql
SELECT 
  property_name,
  payment_due_date,
  rent_amount,
  currency,
  status,
  paid_at
FROM rental_payments 
WHERE tenant_name ILIKE '%Artur Cami%'
ORDER BY payment_due_date DESC;
```

### 3. Historiku i një prone specifike (të gjitha pagesat)

```sql
SELECT 
  payment_due_date,
  tenant_name,
  tenant_phone,
  rent_amount,
  status,
  paid_at,
  created_at
FROM rental_payments 
WHERE property_name = 'Shkalla D Ap.D13'
ORDER BY payment_due_date DESC;
```

### 4. Raport mujor - të gjitha pronat për një muaj

```sql
SELECT 
  property_name,
  grupi,
  shkalla,
  tenant_name,
  rent_amount,
  status,
  paid_at
FROM rental_payments 
WHERE payment_due_date >= '2025-11-01'
  AND payment_due_date <= '2025-11-30'
ORDER BY grupi, property_name;
```

### 5. Pronat e papaguara në një muaj

```sql
SELECT 
  property_name,
  tenant_name,
  tenant_phone,
  rent_amount,
  payment_due_date
FROM rental_payments 
WHERE payment_due_date >= '2025-11-01'
  AND payment_due_date <= '2025-11-30'
  AND status = 'Pa Paguar'
ORDER BY property_name;
```

### 6. Historiku i pagesave për një grup (p.sh. Shkalla D)

```sql
SELECT 
  property_name,
  tenant_name,
  payment_due_date,
  rent_amount,
  status
FROM rental_payments 
WHERE grupi = 'Shkalla D'
  AND payment_due_date >= '2025-01-01'
  AND payment_due_date <= '2025-12-31'
ORDER BY payment_due_date DESC, property_name;
```

### 7. Raport vjetor - total të ardhurat

```sql
SELECT 
  TO_CHAR(payment_due_date, 'YYYY-MM') as muaji,
  COUNT(*) as nr_pronash,
  SUM(CASE WHEN status = 'Paguar' THEN rent_amount ELSE 0 END) as te_ardhura,
  SUM(CASE WHEN status = 'Pa Paguar' THEN rent_amount ELSE 0 END) as te_papaguara
FROM rental_payments 
WHERE payment_due_date >= '2025-01-01'
  AND payment_due_date <= '2025-12-31'
GROUP BY muaji
ORDER BY muaji;
```

### 8. Kush qiraxhiu ka qenë më i rregullt në pagesa?

```sql
SELECT 
  tenant_name,
  COUNT(*) as total_pagesa,
  SUM(CASE WHEN status = 'Paguar' THEN 1 ELSE 0 END) as paguar,
  SUM(CASE WHEN status = 'Pa Paguar' THEN 1 ELSE 0 END) as pa_paguar,
  ROUND(
    100.0 * SUM(CASE WHEN status = 'Paguar' THEN 1 ELSE 0 END) / COUNT(*), 
    2
  ) as perqindja_pagesave
FROM rental_payments 
WHERE tenant_name IS NOT NULL
GROUP BY tenant_name
HAVING COUNT(*) >= 3
ORDER BY perqindja_pagesave DESC;
```

## 💡 Përdorimi në Code (JavaScript/TypeScript)

Në aplikacion, përdorni action-in `getPaymentHistory`:

```typescript
import { getPaymentHistory } from '@/app/prona/actions';

// Example 1: Histori për një pronë
const history = await getPaymentHistory({ 
  property_id: 'uuid-here' 
});

// Example 2: Kërkimi sipas emrit të qiraxhiut
const tenantHistory = await getPaymentHistory({ 
  tenant_name: 'Artur Cami' 
});

// Example 3: Raport mujor
const novemberReport = await getPaymentHistory({ 
  month: '2025-11' 
});

// Example 4: Raport vjetor
const yearReport = await getPaymentHistory({ 
  year: '2025' 
});

// Example 5: Filtër sipas grupit
const shkallaD = await getPaymentHistory({ 
  grupi: 'Shkalla D',
  month: '2025-11'
});
```

## 🎯 Si Funksionon në Praktikë

### Scenario: Qiraxhiu ndryshon

**Sot - 18 Tetor 2025**:
- Prona: "Shkalla D Ap.D13"
- Qiraxhiu: "Artur Cami"
- Data e qirasë: 1 Tetor 2025
- Status: Pa Paguar

**1. Artur paguan qiranë**:
- Owner klikon statusin → zgjedh "Paguar" nga dropdown
- Sistemi krijon rekord në `rental_payments`:
  ```
  property_name: "Shkalla D Ap.D13"
  tenant_name: "Artur Cami"
  payment_due_date: 2025-10-01
  status: "Paguar"
  paid_at: 2025-10-18 15:30:00
  ```
- Data e qirasë lëviz automatikisht në: 1 Nëntor 2025

**2. Në Qershor 2026, owner do të dijë**:
```sql
-- Kush kishte Ap.D13 në Tetor 2025?
SELECT * FROM rental_payments 
WHERE property_name = 'Shkalla D Ap.D13'
  AND payment_due_date = '2025-10-01';
  
-- Rezultat: Artur Cami, Paguar më 18 Tetor 2025
```

## 📈 Benefitet

✅ **Historik i plotë** - Nuk humbet asnjë informacion  
✅ **Raporte të sakta** - Mund të gjenerosh raporte për çdo periudhë  
✅ **Auditim** - Sheh kur u pagua çdo qira  
✅ **Kërkime fleksibël** - Filtro sipas pronës, qiraxhiut, muajit, grupit  
✅ **Ndjekje qiraxhiësh** - Sheh historikun e secilit qiraxhiu  

## 🚀 Të Ardhme

Në të ardhmen, këto të dhëna mund të përdoren për:
- Dashboard me statistika
- Grafe të të ardhurave mujore
- Export në Excel/PDF
- Email reminders automatike
- Raporte tatimore
- Analiza e qiraxhiëve më të mirë/më të këqij

---

**Totali i rekordeve historike në DB**: 74 (nga migrimi fillestar)  
**Çdo ndryshim statusi krijon rekord të ri automatikisht** ✅
