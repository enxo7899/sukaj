import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const KNOWN_GROUPS = [
  '6 KATESHI I BARDHË',
  'Shkalla A+B',
  'Shkalla D',
  'AMBJENTET E MEDHA ME QERA',
  'MAGAZINA',
  'DYQANE',
  'HOTELI',
];

function normalizeGroupName(raw: string): string {
  const trimmed = raw.trim();
  const upperTrimmed = trimmed.toUpperCase();
  
  // Check for exact matches first
  for (const known of KNOWN_GROUPS) {
    if (known.toUpperCase() === upperTrimmed) {
      return known;
    }
  }
  
  // Handle common variations
  if (upperTrimmed === '6 KATESHI I BARDHE') {
    return '6 KATESHI I BARDHË';
  }
  
  return trimmed;
}

function extractShkalla(emertimi: string): string | null {
  const match = emertimi.match(/Shkalla\s*([A-Z]\+?[A-Z]?)/i);
  if (match) {
    const captured = match[1].toUpperCase();
    // Prefer single letter
    if (captured === 'A' || captured === 'B' || captured === 'D') {
      return captured;
    }
    if (captured.includes('A')) return 'A';
    if (captured.includes('B')) return 'B';
    if (captured.includes('D')) return 'D';
  }
  return null;
}

async function importListings() {
  console.log('🚀 Starting Excel import...');
  
  const filePath = path.join(process.cwd(), 'data', 'listings.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  console.log(`📄 Reading sheet: ${sheetName}`);
  
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  // Find header row
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    const firstCell = String(row[0] || '').trim();
    if (firstCell.match(/^Emertimi|Emërtimi$/i)) {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    headerRowIndex = 2; // fallback to row 3 (0-indexed = 2)
  }
  
  console.log(`📍 Header row found at index: ${headerRowIndex}`);
  
  const headers = rawData[headerRowIndex].map((h: any) => String(h).trim());
  
  // Map column indices
  const colMap: Record<string, number> = {};
  headers.forEach((h, idx) => {
    const upper = h.toUpperCase();
    if (upper.match(/EMERTIMI|EMËRTIMI/)) colMap.emertimi = idx;
    else if (upper.match(/EMER.*MBIEMER|EMËR.*MBIEMËR/)) colMap.emri_qiraxhiut = idx;
    else if (upper.match(/NR.*TELEFON|TEL/)) colMap.tel_qiraxhiut = idx;
    else if (upper === 'OSHEE') colMap.oshee = idx;
    else if (upper === 'UKT') colMap.ukt = idx;
  });
  
  console.log('📋 Column mapping:', colMap);
  
  let currentGroup: string | null = null;
  const properties: any[] = [];
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;
    
    const emertimi = String(row[colMap.emertimi] || '').trim();
    if (!emertimi) continue;
    
    // Check if this is a group header
    const isGroupHeader = Object.keys(colMap).every(key => {
      if (key === 'emertimi') return true;
      const idx = colMap[key];
      return !row[idx] || String(row[idx]).trim() === '';
    });
    
    if (isGroupHeader) {
      currentGroup = normalizeGroupName(emertimi);
      console.log(`📂 Found group: ${currentGroup}`);
      continue;
    }
    
    // Normal row
    const emri_qiraxhiut = colMap.emri_qiraxhiut !== undefined ? String(row[colMap.emri_qiraxhiut] || '').trim() : '';
    const tel_qiraxhiut = colMap.tel_qiraxhiut !== undefined ? String(row[colMap.tel_qiraxhiut] || '').trim() : '';
    const oshee = colMap.oshee !== undefined ? String(row[colMap.oshee] || '').trim() : '';
    const ukt = colMap.ukt !== undefined ? String(row[colMap.ukt] || '').trim() : '';
    
    const shkalla = extractShkalla(emertimi);
    
    properties.push({
      emertimi,
      emri_qiraxhiut: emri_qiraxhiut || null,
      tel_qiraxhiut: tel_qiraxhiut || null,
      oshee: oshee || null,
      ukt: ukt || null,
      grupi: currentGroup,
      shkalla,
      tags: [],
      qera_mujore: null,
      monedha: 'EUR',
      dita_skadences: 1,
      status: 'Aktive',
      pershkrim: null,
      adresa: null,
      qyteti: null,
      njesia_administrative: null,
      kodi_postar: null,
    });
  }
  
  console.log(`\n📊 Found ${properties.length} properties to import`);
  
  // Upsert into Supabase
  for (const prop of properties) {
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('properties')
        .select('id')
        .eq('emertimi', prop.emertimi)
        .eq('grupi', prop.grupi || '')
        .maybeSingle();
      
      if (existing) {
        // Update
        const { error } = await supabase
          .from('properties')
          .update(prop)
          .eq('id', existing.id);
        
        if (error) {
          console.error(`❌ Error updating ${prop.emertimi}:`, error.message);
          skipped++;
        } else {
          updated++;
        }
      } else {
        // Insert
        const { error } = await supabase
          .from('properties')
          .insert(prop);
        
        if (error) {
          console.error(`❌ Error inserting ${prop.emertimi}:`, error.message);
          skipped++;
        } else {
          inserted++;
        }
      }
    } catch (err: any) {
      console.error(`❌ Error processing ${prop.emertimi}:`, err.message);
      skipped++;
    }
  }
  
  console.log('\n✅ Import complete!');
  console.log(`   📝 Inserted: ${inserted}`);
  console.log(`   🔄 Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
}

importListings().catch(console.error);
