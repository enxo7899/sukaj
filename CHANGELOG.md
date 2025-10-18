# Changelog - Sukaj Prona Dashboard

## [1.1.0] - 2025-10-18

### 🎯 Major Improvements

#### Rent Payment Tracking System
- **Replaced "Dita e skadencës"** with **"Data e qirasë"**
  - Now shows full date (e.g., "1 Nëntor 2025") instead of just day number
  - Albanian month names for better readability
  
- **New Status System: Paguar / Pa Paguar**
  - ✅ **Paguar** (Green badge) - Rent has been paid
  - ❌ **Pa Paguar** (Red badge) - Rent is unpaid
  - Replaced old "Aktive/Jo aktive" system
  
- **Automatic Date Increment**
  - When you change status from "Pa Paguar" to "Paguar", the rent date automatically moves to next month
  - Example: If data_qirase is "1 Tetor 2025" and you mark as Paguar → it becomes "1 Nëntor 2025"
  - This saves time and prevents errors

#### Fixed Edit Dialog
- **Pre-populated Fields**: When editing a property, ALL existing data now appears in the form
- **Smart Form Reset**: Form properly resets when switching between add/edit modes
- **No Data Loss**: You can now change just one field (e.g., rent price) without having to re-enter everything

### 📊 Database Changes

```sql
-- Added data_qirase column (DATE type)
ALTER TABLE properties ADD COLUMN data_qirase DATE;

-- Migrated from dita_skadences (1-31) to full dates
-- Removed old dita_skadences column
ALTER TABLE properties DROP COLUMN dita_skadences;

-- Updated status values
UPDATE properties SET status = 'Pa Paguar' WHERE status = 'Aktive';
UPDATE properties SET status = 'Paguar' WHERE status = 'Jo aktive';
```

### 🎨 UI Enhancements

- **Albanian Date Formatting**: "1 Nëntor 2025" instead of "2025-11-01"
- **Color-Coded Status Badges**:
  - Paguar: Green (#22c55e)
  - Pa Paguar: Red (destructive variant)
- **Date Input Field**: Modern date picker for selecting rent due date
- **Helper Text**: Added tooltips explaining what "Data e qirasë" means

### 🔧 Technical Details

**Updated Files:**
- `src/types/property.ts` - Updated Property type
- `src/app/prona/property-dialog.tsx` - Fixed form pre-population with useEffect
- `src/app/prona/actions.ts` - Added auto-increment logic
- `src/app/prona/properties-table.tsx` - Updated status badges and date display
- `src/lib/utils.ts` - Added `formatAlbanianDate()` function
- `sql/migrations/` - Database migration for new rent system

### 💡 How It Works

**Scenario Example:**
1. Property "Ap. A1" has rent due on "1 Tetor 2025"
2. Status is "Pa Paguar" (red badge)
3. Owner collects rent and opens edit dialog
4. Changes status to "Paguar"
5. Saves form
6. System automatically updates date to "1 Nëntor 2025"
7. Badge turns green
8. Next month, owner can mark as "Pa Paguar" again when rent is due

### 🐛 Bug Fixes

- ✅ Fixed "6 KATESHI I BARDHË" not showing properties (character encoding E vs Ë)
- ✅ Fixed edit form showing empty fields instead of existing data
- ✅ Fixed status dropdown not using new values
- ✅ Fixed React import issue in property dialog

---

## [1.0.0] - 2025-10-17

### 🚀 Initial Release

- Modern rental property management dashboard
- Full CRUD operations for properties
- Organized sidebar with apartments and other categories
- Excel import functionality
- Fast client-side navigation
- Dark theme design
- Albanian language throughout
- 74 properties imported from Excel

**Property Categories:**
- Apartamente (6 KATESHI I BARDHË, Shkalla A+B, Shkalla D)
- Ambjentet e mëdha (Magazina, Dyqane, Hoteli)

**Tech Stack:**
- Next.js 15 (App Router)
- Supabase (PostgreSQL)
- Tailwind CSS 4
- shadcn/ui components
- TypeScript
- React Hook Form + Zod

---

**Total Properties in Database: 74**
- 6 KATESHI I BARDHË: 9
- Shkalla A+B: 18
- Shkalla D: 36
- MAGAZINA: 7
- DYQANE: 2
- HOTELI: 1
- AMBJENTET E MEDHA ME QERA: 1
