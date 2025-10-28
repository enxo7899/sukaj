/**
 * Cron Job: Process Rent Due Today
 * 
 * Runs daily to:
 * 1. Save payment history (Paguar -> rental_payments table)
 * 2. Reset all properties to 'Pa Paguar' for new month
 * 3. Send SMS notifications
 * 
 * Should run BEFORE the SMS notifications (e.g., 5:00 AM UTC)
 * Then SMS runs at 6:00 AM UTC
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ========================================
// Configuration
// ========================================

/**
 * Verifies the request authorization
 */
function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('CRON_SECRET not set - allowing all requests in development');
    return true;
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('Invalid authorization');
    return false;
  }

  return true;
}

/**
 * Creates a Supabase client with service role
 */
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// ========================================
// API Route Handler
// ========================================

export async function GET(request: NextRequest) {
  console.log('🔄 Starting rent due processing...');

  // Verify authorization
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();

  try {
    // Call the database function to process all rent due today
    const { data, error } = await supabase.rpc('process_all_rent_due_today_simple');

    if (error) {
      console.error('Error processing rent due:', error);
      return NextResponse.json(
        { error: 'Failed to process rent due', details: error.message },
        { status: 500 }
      );
    }

    const result = data as {
      success: boolean;
      processed_at: string;
      total_processed: number;
      total_paid_last_month: number;
      total_unpaid_last_month: number;
      details: any[];
    };

    console.log(`✅ Processed ${result.total_processed} properties`);
    console.log(`   💰 Paid last month: ${result.total_paid_last_month}`);
    console.log(`   ⚠️  Unpaid last month: ${result.total_unpaid_last_month}`);

    return NextResponse.json({
      ...result,
      message: 'Rent due processing complete',
    });
  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
