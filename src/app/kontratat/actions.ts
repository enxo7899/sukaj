'use server';

import { createClient } from '@/lib/supabase-server';
import { Kontrate } from '@/types/kontrate';
import { revalidatePath } from 'next/cache';

export async function listoKontratat(filters?: { q?: string }): Promise<Kontrate[]> {
  const supabase = await createClient();
  let query = supabase.from('kontratat').select('*');

  if (filters?.q) {
    const q = filters.q;
    query = query.or(
      [
        `qera_marres.ilike.%${q}%`,
        `qera_dhenes.ilike.%${q}%`,
        `nr_apartament.ilike.%${q}%`,
        `vendi.ilike.%${q}%`,
        `nr_repert.ilike.%${q}%`,
        `nr_koleks.ilike.%${q}%`,
      ].join(',')
    );
  }

  const { data, error } = await query.order('fillimi_kontrates', { ascending: false });

  if (error) {
    console.error('❌ Error fetching kontratat:', error);
    return [];
  }

  return (data as Kontrate[]) || [];
}

export async function krijoKontrate(input: Partial<Kontrate>) {
  const supabase = await createClient();
  const { error } = await supabase.from('kontratat').insert(input);
  if (error) {
    console.error('❌ Error creating kontrate:', error);
    return { success: false, error: error.message };
  }
  revalidatePath('/kontratat');
  return { success: true };
}

export async function perditesoKontrate(id: string, input: Partial<Kontrate>) {
  const supabase = await createClient();
  const { error } = await supabase.from('kontratat').update(input).eq('id', id);
  if (error) {
    console.error('❌ Error updating kontrate:', error);
    return { success: false, error: error.message };
  }
  revalidatePath('/kontratat');
  return { success: true };
}

export async function fshiKontrate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('kontratat').delete().eq('id', id);
  if (error) {
    console.error('❌ Error deleting kontrate:', error);
    return { success: false, error: error.message };
  }
  revalidatePath('/kontratat');
  return { success: true };
}
