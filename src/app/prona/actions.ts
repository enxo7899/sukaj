'use server';

import { createClient } from '@/lib/supabase-server';
import { Property } from '@/types/property';
import { revalidatePath } from 'next/cache';

const APARTMENT_GROUPS = ['6 KATESHI I BARDHË', 'Shkalla A+B', 'Shkalla D'];
const OTHER_GROUPS = ['MAGAZINA', 'DYQANE', 'HOTELI', 'AMBJENTET E MEDHA ME QERA'];

export async function listoPronat(filters?: {
  q?: string;
  grupi?: string;
  shkalla?: string;
  type?: string;
}): Promise<Property[]> {
  console.log('🔍 Fetching properties with filters:', filters);
  const supabase = await createClient();
  let query = supabase.from('properties').select('*');

  // Handle apartment type filter
  if (filters?.type === 'apartamente') {
    query = query.in('grupi', APARTMENT_GROUPS);
  } else if (filters?.grupi) {
    query = query.eq('grupi', filters.grupi);
  }

  if (filters?.shkalla) {
    query = query.eq('shkalla', filters.shkalla);
  }

  if (filters?.q) {
    query = query.or(
      `emertimi.ilike.%${filters.q}%,emri_qiraxhiut.ilike.%${filters.q}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error fetching properties:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return [];
  }

  console.log('✅ Properties fetched:', data?.length || 0);
  const properties = (data as Property[]) || [];

  // Sort: apartments first, then others
  // Within each group, sort by grupi, then by created_at
  return properties.sort((a, b) => {
    const aIsApartment = APARTMENT_GROUPS.includes(a.grupi || '');
    const bIsApartment = APARTMENT_GROUPS.includes(b.grupi || '');

    // Apartments come first
    if (aIsApartment && !bIsApartment) return -1;
    if (!aIsApartment && bIsApartment) return 1;

    // Within same type, sort by grupi
    if (a.grupi !== b.grupi) {
      return (a.grupi || '').localeCompare(b.grupi || '');
    }

    // Within same grupi, sort by emertimi
    return (a.emertimi || '').localeCompare(b.emertimi || '');
  });
}

export async function krijoProne(input: Partial<Property>) {
  const supabase = await createClient();
  const { error } = await supabase.from('properties').insert({
    ...input,
    tags: input.tags || [],
  });

  if (error) {
    console.error('Error creating property:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/prona');
  return { success: true };
}

export async function perditesoProne(id: string, input: Partial<Property>, oldStatus?: string) {
  const supabase = await createClient();
  // Get current property data first
  const { data: currentProperty } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (!currentProperty) {
    return { success: false, error: 'Property not found' };
  }

  // If status is being changed from "Pa Paguar" to "Paguar", auto-increment rent date
  let updateData = { ...input };
  
  if (oldStatus === 'Pa Paguar' && input.status === 'Paguar' && input.data_qirase) {
    // Move rent date to next month
    const currentDate = new Date(input.data_qirase);
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    updateData.data_qirase = nextMonth.toISOString().split('T')[0];
  }

  // Update property
  const { error } = await supabase
    .from('properties')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating property:', error);
    return { success: false, error: error.message };
  }

  // If status changed,  // Record payment history if status changed to Paguar
  const hasStatusChanged = input.status && input.status !== oldStatus;
  if (hasStatusChanged && input.status === 'Paguar') {
    await recordPaymentHistory(supabase, id, currentProperty, input.status, input.data_qirase);
  }

  revalidatePath('/prona');
  return { success: true };
}

async function recordPaymentHistory(
  supabase: any,
  propertyId: string, 
  property: any, 
  newStatus: string,
  dueDate?: string | null
) {
  const paymentRecord = {
    property_id: propertyId,
    tenant_name: property.emri_qiraxhiut,
    tenant_phone: property.tel_qiraxhiut,
    rent_amount: property.qera_mujore,
    currency: property.monedha || 'EUR',
    payment_due_date: dueDate || property.data_qirase,
    status: newStatus,
    paid_at: newStatus === 'Paguar' ? new Date().toISOString() : null,
    property_name: property.emertimi,
    grupi: property.grupi,
    shkalla: property.shkalla,
  };

  await supabase.from('rental_payments').insert(paymentRecord);
}

export async function fshiProne(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting property:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/prona');
  return { success: true };
}

// Query payment history for reports
export async function getPaymentHistory(filters?: {
  property_id?: string;
  tenant_name?: string;
  month?: string; // Format: YYYY-MM
  year?: string;  // Format: YYYY
  grupi?: string;
  shkalla?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from('rental_payments')
    .select('*')
    .order('payment_due_date', { ascending: false });

  if (filters?.property_id) {
    query = query.eq('property_id', filters.property_id);
  }

  if (filters?.tenant_name) {
    query = query.ilike('tenant_name', `%${filters.tenant_name}%`);
  }

  if (filters?.grupi) {
    query = query.eq('grupi', filters.grupi);
  }

  if (filters?.shkalla) {
    query = query.eq('shkalla', filters.shkalla);
  }

  if (filters?.month) {
    // Query for specific month (e.g., "2025-11")
    const startDate = `${filters.month}-01`;
    const endDate = `${filters.month}-31`;
    query = query.gte('payment_due_date', startDate).lte('payment_due_date', endDate);
  } else if (filters?.year) {
    // Query for entire year (e.g., "2025")
    query = query.gte('payment_due_date', `${filters.year}-01-01`)
                 .lte('payment_due_date', `${filters.year}-12-31`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }

  return data || [];
}
