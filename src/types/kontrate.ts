export type Kontrate = {
  id: string;
  nr_repert?: string | null;
  nr_koleks?: string | null;
  qera_dhenes?: string | null;
  qera_marres?: string | null;
  nr_apartament?: string | null;
  m2?: number | null;
  dyqane?: string | null;
  vendi?: string | null;
  fillimi_kontrates?: string | null; // YYYY-MM-DD
  mbarimi_kontrates?: string | null; // YYYY-MM-DD
  vlera_bruto?: number | null;
  monedha_bruto?: string | null; // EUR | ALL | USD
  vlera_neto?: number | null;
  monedha_neto?: string | null; // EUR | ALL | USD
  garanci?: number | null;
  monedha_garanci?: string | null; // EUR | ALL | USD
  kontrate_drita?: string | null;
  kontrate_uji?: string | null;
  created_at: string;
  updated_at: string;
};
