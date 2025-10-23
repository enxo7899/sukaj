import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

function isNonEmpty(value: any) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('❌ Please provide the Excel file path');
    console.log('Usage: tsx scripts/inspect-kontrata-excel.ts "/absolute/path/to/Kontrata Qeraje.xlsx"');
    process.exit(1);
  }

  const fullPath = path.isAbsolute(inputPath)
    ? inputPath
    : path.join(process.cwd(), inputPath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(fullPath);
  const sheetNames = workbook.SheetNames;
  if (!sheetNames.length) {
    console.error('❌ No sheets found in workbook');
    process.exit(1);
  }

  const sheetIndex = 0; // Sheet number 1 (1-based) => index 0
  const sheetName = sheetNames[sheetIndex];
  const ws = workbook.Sheets[sheetName];

  console.log('📄 Workbook info:');
  console.log('─'.repeat(80));
  console.log(`Sheets (${sheetNames.length}): ${sheetNames.join(', ')}`);
  console.log(`Using sheet #1 => index ${sheetIndex}, name: ${sheetName}`);
  console.log('─'.repeat(80));

  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (!rows.length) {
    console.error('❌ No rows found in selected sheet');
    process.exit(1);
  }

  // Determine header row: first row with at least 2 non-empty cells
  let headerRowIndex = rows.findIndex(r => (r || []).filter(isNonEmpty).length >= 2);
  if (headerRowIndex < 0) headerRowIndex = 0;

  const headers = (rows[headerRowIndex] || []).map((h: any) => String(h).trim());
  console.log('\n🧾 Detected headers (row ' + (headerRowIndex + 1) + '):');
  headers.forEach((h, i) => console.log(`  [${i}] ${h || '(empty)'}`));

  const dataRows = rows.slice(headerRowIndex + 1).filter(r => (r || []).some(isNonEmpty));
  console.log('\n🔎 Sample rows (first up to 5):');
  for (let i = 0; i < Math.min(5, dataRows.length); i++) {
    const r = dataRows[i] || [];
    const obj: Record<string, any> = {};
    headers.forEach((h, idx) => {
      const key = h || `COL_${idx + 1}`;
      obj[key] = r[idx] ?? '';
    });
    console.log(`Row ${i + 1}:`, obj);
  }

  console.log('\n✅ Inspection complete. Use these headers to design the kontratat schema.');
}

main();
