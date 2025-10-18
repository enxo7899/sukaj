# Sukaj Prona - Dashboard për Menaxhimin e Pronave

Dashboard modern në shqip për menaxhimin e pronave me qera, ndërtuar me Next.js 15, Supabase, Tailwind CSS dhe shadcn/ui.

## 🌟 Karakteristikat

- ✨ **UI modern dhe elegante** me dark theme
- 🏢 **Menaxhim i plotë CRUD** për pronat
- 📊 **Organizim i avancuar** - Apartamente dhe Ambjentet e mëdha
- 🔍 **Kërkim në kohë reale** sipas emërtimit dhe qiraxhiut
- 📱 **Design responsive** për të gjitha paisjet
- ⚡ **Navigim i shpejtë** me client-side routing
- 🗂️ **Filtra të fuqishëm** sipas grupit dhe shkallës
- 📥 **Import automatik** nga Excel

## 🛠️ Stack Teknologjik

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Language**: TypeScript

## 📦 Instalimi

1. **Klononi projektin**
```bash
cd /Users/enxom/Desktop/Sukaj/rental-dashboard
```

2. **Instaloni dependencies**
```bash
pnpm install
```

3. **Konfiguroni environment variables**

Krijoni një file `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://spjyoppunobbtcviqiwg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

4. **Setup Database**

Databaza është tashmë e konfiguruar në Supabase. Tabela `properties` është në schema `public`.

5. **Importoni të dhënat nga Excel** (opsionale)

Nëse keni një file Excel të ri për import:
```bash
# Vendosni file në data/listings.xlsx
pnpm seed:listings
```

## 🚀 Ekzekutimi

**Development server:**
```bash
pnpm dev
```

Hapeni [http://localhost:3001](http://localhost:3001) në browser.

**Production build:**
```bash
pnpm build
pnpm start
```

## 📁 Struktura e Projektit

```
rental-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout kryesor me sidebar
│   │   ├── page.tsx            # Faqja kryesore
│   │   └── prona/              # Faqja e pronave
│   │       ├── page.tsx        # Server component
│   │       ├── actions.ts      # Server actions
│   │       ├── properties-table.tsx
│   │       └── property-dialog.tsx
│   ├── components/
│   │   ├── sidebar.tsx         # Navigimi anësor
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   └── utils.ts            # Utility functions
│   └── types/
│       └── property.ts         # TypeScript types
├── scripts/
│   ├── import-listings.ts      # Excel import script
│   └── run-sql.ts              # SQL runner
├── sql/
│   └── 01_schema.sql           # Database schema
└── data/
    └── listings.xlsx           # Excel file për import
```

## 🏗️ Struktura e të Dhënave

Tabela `properties` përmban fushat:
- `emertimi` - Emërtimi i pronës
- `grupi` - Kategoria (6 KATESHI I BARDHË, Shkalla A+B, MAGAZINA, etj.)
- `shkalla` - Shkalla (A, B, D)
- `emri_qiraxhiut` - Emri i qiraxhiut
- `tel_qiraxhiut` - Nr. telefoni
- `oshee` - Kodi OSHEE
- `ukt` - Kodi UKT
- `qera_mujore` - Qera mujore
- `monedha` - Monedha (EUR/ALL/USD)
- `dita_skadences` - Dita e skadencës (1-31)
- `status` - Status (Aktive/Jo aktive)
- Dhe fusha të tjera...

## 📱 Kategoritë e Pronave

### Apartamente
- **Të gjitha apartamentet** - Përmbledhje e të gjitha apartamenteve
  - 6 KATESHI I BARDHË
  - Shkalla A+B
  - Shkalla D

### Ambjentet e Mëdha (Collapsible)
- Magazina
- Dyqane
- Hoteli

### Të gjitha pronat
Lista e plotë e të gjitha pronave (apartamentet shfaqen të parat)

## 🎨 Design Features

- **Dark Theme Premium** - Ngjyra moderne dhe elegante
- **Sidebar Interaktiv** - Me collapsible sections
- **Table e Avancuar** - Me sorting dhe filtering
- **Dialogs Moderne** - Për create/edit operations
- **Toast Notifications** - Feedback i menjëhershëm për përdoruesin
- **Responsive Layout** - Funksionon në të gjitha madhësitë e ekranit

## 🔄 Funksionalitete CRUD

- ✅ **Create** - Shto prona të reja
- ✅ **Read** - Shiko listen e pronave me filtra
- ✅ **Update** - Përditëso të dhënat e pronave
- ✅ **Delete** - Fshi prona (me konfirmim)

## 🚧 Të ardhme (Planifikuar)

- 📧 Email reminders kur afron data e skadencës
- 📊 Raporte financiare
- 📈 Dashboard me statistika
- 📄 Export në PDF/Excel
- 🔔 Sistem njoftimesh

## 📞 Kontakt

Për çështje teknike ose pyetje, kontaktoni zhvilluesin.

---

**© 2025 Sukaj Properties** - Të gjitha të drejtat e rezervuara.
