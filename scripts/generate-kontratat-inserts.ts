import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

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
  const m = s.match(/^(\d{1,2})[.](\d{1,2})[.](\d{2,4})$/);
  if (m) {
    let [_, d, mo, y] = m;
    if (y.length === 2) y = (Number(y) >= 70 ? '19' : '20') + y; // heuristic
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

function sqlValue(v: any, isNumeric = false): string {
  if (v === null || v === undefined || v === '') return 'NULL';
  if (isNumeric) {
    const n = Number(v);
    return Number.isFinite(n) ? String(n) : 'NULL';
  }
  // date or text
  const s = String(v).replace(/'/g, "''");
  return `'${s}'`;
}

function main() {
  const inputPathArg = process.argv[2];
  if (!inputPathArg) {
    console.error('❌ Please provide Excel file path');
    console.log('Usage: tsx scripts/generate-kontratat-inserts.ts "/absolute/path/to/Kontrata Qeraje.xlsx"');
    process.exit(1);
  }
  const filePath = path.isAbsolute(inputPathArg) ? inputPathArg : path.join(process.cwd(), inputPathArg);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (!rows.length) {
    console.error('❌ No rows in sheet');
    process.exit(1);
  }

  const headers = (rows[0] || []).map((h) => normalizeHeader(String(h || '')));
  const idx: Record<string, number> = {};
  headers.forEach((h, i) => (idx[h] = i));

  const data = rows.slice(1).filter((r) => (r || []).some((v) => String(v).trim() !== ''));

  const columns = [
    'nr_repert','nr_koleks','qera_dhenes','qera_marres','nr_apartament','m2','dyqane','vendi',
    'fillimi_kontrates','mbarimi_kontrates','vlera_bruto','monedha_bruto','vlera_neto','monedha_neto',
    'garanci','monedha_garanci','kontrate_drita','kontrate_uji'
  ];

  const valuesSql: string[] = [];

  for (const r of data) {
    const get = (name: string) => {
      const i = idx[name];
      return i !== undefined ? r[i] : '';
    };
    const bruto = parseMoney(get('vlera_bruto'));
    const neto = parseMoney(get('vlera_neto'));
    const gar = parseMoney(get('garanci'));
    const m2Raw = get('m2');
    const m2 = m2Raw !== '' && m2Raw !== null ? Number(String(m2Raw).replace(/[^0-9.]/g, '')) : null;

    const row = {
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
    } as Record<string, any>;

    // Basic filter: skip empty
    if (!row.qera_marres && !row.qera_dhenes && !row.nr_apartament) continue;

    const vals = [
      sqlValue(row.nr_repert),
      sqlValue(row.nr_koleks),
      sqlValue(row.qera_dhenes),
      sqlValue(row.qera_marres),
      sqlValue(row.nr_apartament),
      sqlValue(row.m2, true),
      sqlValue(row.dyqane),
      sqlValue(row.vendi),
      sqlValue(row.fillimi_kontrates),
      sqlValue(row.mbarimi_kontrates),
      sqlValue(row.vlera_bruto, true),
      sqlValue(row.monedha_bruto),
      sqlValue(row.vlera_neto, true),
      sqlValue(row.monedha_neto),
      sqlValue(row.garanci, true),
      sqlValue(row.monedha_garanci),
      sqlValue(row.kontrate_drita),
      sqlValue(row.kontrate_uji),
    ];

    valuesSql.push(`(${vals.join(', ')})`);
  }

  if (!valuesSql.length) {
    console.error('⚠️ No valid rows to insert.');
    process.exit(1);
  }

  const columnsSql = columns.map((c) => '"' + c + '"').join(', ');
  const updateSet = columns
    .map((c) => `"${c}" = EXCLUDED."${c}"`)
    .join(', ');

  const sql = `INSERT INTO public.kontratat (${columnsSql})\nVALUES\n${valuesSql.join(',\n')}\nON CONFLICT (nr_repert, nr_koleks) DO UPDATE SET\n${updateSet};`;

  console.log(sql);
}

main();
