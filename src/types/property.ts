export type Property = {
  id: string;
  emertimi: string;
  emri_qiraxhiut?: string | null;
  tel_qiraxhiut?: string | null;
  oshee?: string | null;
  ukt?: string | null;
  grupi?: string | null;    // "6 KATESHI I BARDHË", "Shkalla A+B", "Shkalla D", "AMBJENTET E MEDHA ME QERA", "MAGAZINA", "DYQANE", "HOTELI"
  shkalla?: string | null;  // "A" | "B" | "D"
  tags: string[];
  qera_mujore?: number | null;
  monedha?: string | null;  // default 'EUR'
  data_qirase?: string | null; // Date when rent is due (YYYY-MM-DD)
  status: 'Paguar' | 'Pa Paguar';
  pershkrim?: string | null;
  adresa?: string | null;
  qyteti?: string | null;
  njesia_administrative?: string | null;
  kodi_postar?: string | null;
  created_at: string;
  updated_at: string;
};

export const KNOWN_GROUPS = [
  '6 KATESHI I BARDHË',
  'Shkalla A+B', 
  'Shkalla D',
  'AMBJENTET E MEDHA ME QERA',
  'MAGAZINA',
  'DYQANE',
  'HOTELI',
] as const;

// Alternate spellings for import compatibility
export const GROUP_MAPPINGS: Record<string, string> = {
  '6 KATESHI I BARDHE': '6 KATESHI I BARDHË',
  '6 KATESHI I BARDHË': '6 KATESHI I BARDHË',
};
