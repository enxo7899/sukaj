import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function stripDiacritics(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeHeader(h: string) {
  const clean = stripDiacritics(h.toLowerCase())
    .replace(/[\n\r]+/g, ' ')
    .replace(/[\.:]/g, '')
    .replace(/-/g, ' ')
    .trim();
  const alias: Record<string, string> = {
    'nr repert': 'nr_repert',
    'nr koleks': 'nr_koleks',
    'qera dhenes': 'qera_dhenes',
    'qera marres': 'qera_marres',
    'nr apartament': 'nr_apartament',
    'm2': 'm2',
    'dyqane': 'dyqane',
    'vendi': 'vendi',
    'fillimi kontrates': 'fillimi_kontrates',
    'mbarimi kontrates': 'mbarimi_kontrates',
    'vlera bruto': 'vlera_bruto',
    'vlera neto': 'vlera_neto',
    'garanci': 'garanci',
    'kontrate drita': 'kontrate_drita',
    'kontrate uji': 'kontrate_uji',
  };
  return alias[clean] || clean.replace(/\s+/g, '_');
}

function parseDate(input: any): string | null {
  if (!input) return null;
  let s = String(input);
  s = s.replace(/[\n\r\t ]+/g, '');
  if (!s) return null;
  // Expect dd.mm.yyyy or dd.mm.yy
  const m = s.match(/^(\d{1,2})[.](\d{1,2})[.](\d{2,4})$/);
  if (m) {
    let [_, d, mo, y] = m;
    if (y.length === 2) y = (Number(y) >= 70 ? '19' : '20') + y; // heuristic
    const yyyy = y.padStart(4, '0');
    const mm = mo.padStart(2, '0');
    const dd = d.padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  // Try Excel date serial
  const num = Number(s);
  if (!Number.isNaN(num)) {
    // Excel serial date (assuming 1900-based)
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const ms = epoch.getTime() + num * 24 * 60 * 60 * 1000;
    const d = new Date(ms);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

function parseMoney(input: any): { amount: number | null; currency: string | null } {
  if (input === null || input === undefined) return { amount: null, currency: null };
  let s = String(input).trim();
  if (!s) return { amount: null, currency: null };
  const sClean = stripDiacritics(s).toUpperCase();
  let currency: string | null = null;
  if (/(EURO|EUR)/.test(sClean)) currency = 'EUR';
  else if (/(LEKE|LEK|ALL)/.test(sClean)) currency = 'ALL';
  else if (/(USD|DOLLAR|DOLLAR)/.test(sClean)) currency = 'USD';

  const digits = sClean.replace(/[^0-9.,]/g, '').replace(/,/g, '');
  const amount = digits ? Number(digits) : null;
  return { amount: Number.isFinite(amount as number) ? amount : null, currency };
}

async function importKontratat(excelPathArg?: string) {
  console.log('🚀 Starting contracts Excel import...');
  const inputArg = excelPathArg || process.argv[2];
  if (!inputArg) {
    console.error('❌ Please provide Excel file path');
    console.log('Usage: tsx scripts/import-kontratat.ts "/absolute/path/to/Kontrata Qeraje.xlsx"');
    process.exit(1);
  }

  const filePath = path.isAbsolute(inputArg) ? inputArg : path.join(process.cwd(), inputArg);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  console.log(`📄 Reading sheet: ${sheetName}`);

  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!rawData.length) {
    console.error('❌ No data');
    process.exit(1);
  }

  const headerRow = rawData[0];
  const headers = headerRow.map((h) => normalizeHeader(String(h || '')));

  const idx: Record<string, number> = {};
  headers.forEach((h, i) => (idx[h] = i));

  const rows = rawData.slice(1).filter((r) => (r || []).some((v) => String(v).trim() !== ''));

  const payload = rows.map((r) => {
    const get = (name: string) => {
      const i = idx[name];
      return i !== undefined ? r[i] : '';
    };

    const bruto = parseMoney(get('vlera_bruto'));
    const neto = parseMoney(get('vlera_neto'));
    const gar = parseMoney(get('garanci'));

    const m2Raw = get('m2');
    const m2 = m2Raw !== '' && m2Raw !== null ? Number(String(m2Raw).replace(/[^0-9.]/g, '')) : null;

    const obj: any = {
      nr_repert: String(get('nr_repert') || '').trim() || null,
      nr_koleks: String(get('nr_koleks') || '').trim() || null,
      qera_dhenes: String(get('qera_dhenes') || '').trim() || null,
      qera_marres: String(get('qera_marres') || '').trim() || null,
      nr_apartament: String(get('nr_apartament') || '').trim() || null,
      m2: Number.isFinite(m2 as number) ? (m2 as number) : null,
      dyqane: String(get('dyqane') || '').trim() || null,
      vendi: String(get('vendi') || '').trim() || null,
      fillimi_kontrates: parseDate(get('fillimi_kontrates')),
      mbarimi_kontrates: parseDate(get('mbarimi_kontrates')),
      vlera_bruto: bruto.amount,
      monedha_bruto: bruto.currency || 'EUR',
      vlera_neto: neto.amount,
      monedha_neto: neto.currency || bruto.currency || 'EUR',
      garanci: gar.amount,
      monedha_garanci: gar.currency || bruto.currency || 'EUR',
      kontrate_drita: String(get('kontrate_drita') || '').trim() || null,
      kontrate_uji: String(get('kontrate_uji') || '').trim() || null,
    };

    if (!obj.qera_marres && !obj.qera_dhenes && !obj.nr_apartament) {
      return null;
    }
    return obj;
  }).filter(Boolean);

  console.log(`\n📊 Prepared ${payload.length} kontrata për import`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const chunk of chunked(payload, 100)) {
    const { error, data } = await supabase
      .from('kontratat')
      .upsert(chunk as any, { onConflict: 'nr_repert,nr_koleks' })
      .select('id, nr_repert, nr_koleks');

    if (error) {
      console.error('❌ Upsert error:', error.message);
      skipped += chunk.length;
    } else {
      inserted += (data || []).length; // approximate
    }
  }

  console.log('\n✅ Import complete!');
  console.log(`   📝 Inserted/Updated: ${inserted}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
}

function* chunked<T>(arr: T[], size: number): Generator<T[]> {
  for (let i = 0; i < arr.length; i += size) {
    yield arr.slice(i, i + size);
  }
}

importKontratat().catch((e) => {
  console.error(e);
  process.exit(1);
});
