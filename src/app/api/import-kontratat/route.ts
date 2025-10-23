import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { createClient as createServerSupabase } from '@/lib/supabase-server';
import { getUserRole } from '@/lib/supabase-server';

function stripDiacritics(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
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
  const m = s.match(/^(\d{1,2})[.](\d{1,2})[.](\d{2,4})$/);
  if (m) {
    let [_, d, mo, y] = m;
    if (y.length === 2) y = (Number(y) >= 70 ? '19' : '20') + y;
    const yyyy = y.padStart(4, '0');
    const mm = mo.padStart(2, '0');
    const dd = d.padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  const num = Number(s);
  if (!Number.isNaN(num)) {
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
  else if (/(USD)/.test(sClean)) currency = 'USD';
  const digits = sClean.replace(/[^0-9.,]/g, '').replace(/,/g, '');
  const amount = digits ? Number(digits) : null;
  return { amount: Number.isFinite(amount as number) ? amount : null, currency };
}

async function runImport(excelPath: string) {
  if (!fs.existsSync(excelPath)) {
    return { ok: false, error: `File not found: ${excelPath}` };
  }
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!rawData.length) return { ok: false, error: 'No data in sheet' };
  const headers = (rawData[0] || []).map((h) => normalizeHeader(String(h || '')));
  const idx: Record<string, number> = {};
  headers.forEach((h, i) => (idx[h] = i));
  const rows = rawData.slice(1).filter((r) => (r || []).some((v) => String(v).trim() !== ''));

  const payload = rows
    .map((r) => {
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
      if (!obj.qera_marres && !obj.qera_dhenes && !obj.nr_apartament) return null;
      return obj;
    })
    .filter(Boolean) as any[];

  const supabase = await createServerSupabase();
  // Upsert in chunks (authenticated session -> RLS admin policy applies)
  let inserted = 0;
  let skipped = 0;
  for (let i = 0; i < payload.length; i += 100) {
    const chunk = payload.slice(i, i + 100);
    const { error, data } = await supabase
      .from('kontratat')
      .upsert(chunk, { onConflict: 'nr_repert,nr_koleks' })
      .select('id');
    if (error) {
      skipped += chunk.length;
    } else {
      inserted += data?.length || 0;
    }
  }
  return { ok: true, inserted, skipped };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get('confirm') !== '1') {
    return NextResponse.json({
      ok: true,
      message: 'To run the import, call this endpoint with ?confirm=1 while logged in as admin.',
    });
  }
  const role = await getUserRole();
  if (!role || role.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Unauthorized: admin only' }, { status: 403 });
  }
  const excelPath = '/Users/enxom/Desktop/Sukaj/Kontrata Qeraje.xlsx';
  const result = await runImport(excelPath);
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const role = await getUserRole();
  if (!role || role.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Unauthorized: admin only' }, { status: 403 });
    }
  const body = await req.json().catch(() => ({}));
  const excelPath = body?.excelPath || '/Users/enxom/Desktop/Sukaj/Kontrata Qeraje.xlsx';
  const result = await runImport(excelPath);
  return NextResponse.json(result);
}
