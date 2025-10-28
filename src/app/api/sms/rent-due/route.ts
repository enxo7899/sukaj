/**
 * SMS Notifications for Rent Due Today
 * 
 * Sends SMS notifications to:
 * - Each tenant individually with their property details
 * - Owner receives ONE consolidated SMS with all properties due today
 * 
 * Can be triggered manually or via cron job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSmsWithFallback } from '@/lib/twilio';

// ========================================
// Types
// ========================================

interface PropertyDueToday {
  property_id: string;
  property_name: string;
  property_short_code: string | null;
  tenant_name: string | null;
  tenant_phone: string | null;
  owner_phone: string | null;
  rent_amount: number | null;
  currency: string | null;
  due_date: string;
}

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

/**
 * Generates idempotency key
 */
function generateIdempotencyKey(
  channel: 'sms',
  type: string,
  identifier: string,
  date: Date
): string {
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  return `${channel}-${type}-${dateStr}-${identifier}`;
}

/**
 * Checks if notification already sent
 */
async function hasNotificationBeenSent(
  supabase: ReturnType<typeof getServiceClient>,
  idempotencyKey: string
): Promise<boolean> {
  const { data } = await supabase
    .from('rent_notifications')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .eq('status', 'sent')
    .maybeSingle();

  return !!data;
}

/**
 * Logs notification to database
 */
async function logNotification(
  supabase: ReturnType<typeof getServiceClient>,
  params: {
    propertyId?: string;
    channel: 'sms';
    recipient: string;
    status: string;
    messageSid?: string;
    errorCode?: number;
    errorMessage?: string;
    idempotencyKey: string;
    notificationType: string;
    messageBody: string;
  }
) {
  await supabase.from('rent_notifications').insert({
    property_id: params.propertyId || null,
    channel: params.channel,
    recipient: params.recipient,
    status: params.status,
    message_sid: params.messageSid,
    error_code: params.errorCode,
    error_message: params.errorMessage,
    idempotency_key: params.idempotencyKey,
    notification_type: params.notificationType,
    message_body: params.messageBody,
    sent_at: params.status === 'sent' ? new Date().toISOString() : null,
    failed_at: params.status === 'failed' ? new Date().toISOString() : null,
  });
}

/**
 * Generates tenant SMS body
 */
function generateTenantSmsBody(
  tenantName: string,
  propertyName: string,
  rentAmount: number | null,
  currency: string | null
): string {
  const amountStr = rentAmount && currency 
    ? ` Shuma: ${rentAmount} ${currency}.`
    : '';
  
  return `Përshëndetje ${tenantName}, ju rikujtojmë se qiraja për pronën ${propertyName} përfundon sot.${amountStr} Ju lutemi të kryeni pagesën. Faleminderit!`;
}

/**
 * Generates consolidated owner SMS body
 */
function generateOwnerConsolidatedSms(properties: PropertyDueToday[]): string {
  const count = properties.length;
  const intro = count === 1 
    ? 'Kujtesë: 1 qira përfundon sot:\n\n'
    : `Kujtesë: ${count} qira përfundojnë sot:\n\n`;
  
  const propertyList = properties.map((p, index) => {
    const tenantInfo = p.tenant_name ? `Qiramarrës: ${p.tenant_name}` : 'Qiramarrës: N/A';
    const phoneInfo = p.tenant_phone ? `\nTel: ${p.tenant_phone}` : '';
    const amountInfo = p.rent_amount && p.currency 
      ? `\nShuma: ${p.rent_amount} ${p.currency}`
      : '';
    
    return `${index + 1}. ${p.property_name}\n${tenantInfo}${phoneInfo}${amountInfo}`;
  }).join('\n\n');
  
  return `${intro}${propertyList}\n\n- Sukaj Properties`;
}

/**
 * Sends SMS to tenant
 */
async function sendTenantSms(
  supabase: ReturnType<typeof getServiceClient>,
  property: PropertyDueToday
): Promise<{ success: boolean; error?: string }> {
  const today = new Date();
  const idempotencyKey = generateIdempotencyKey('sms', 'tenant-due', property.property_id, today);

  // Check if already sent
  if (await hasNotificationBeenSent(supabase, idempotencyKey)) {
    console.log(`✓ SMS already sent to tenant for ${property.property_name}`);
    return { success: true };
  }

  // Validate tenant data
  if (!property.tenant_phone || !property.tenant_name) {
    console.warn(`⚠ Missing tenant data for ${property.property_name}`);
    return { success: false, error: 'Missing tenant data' };
  }

  const messageBody = generateTenantSmsBody(
    property.tenant_name,
    property.property_name,
    property.rent_amount,
    property.currency
  );

  try {
    const result = await sendSmsWithFallback({
      to: property.tenant_phone,
      body: messageBody,
    });

    await logNotification(supabase, {
      propertyId: property.property_id,
      channel: 'sms',
      recipient: property.tenant_phone,
      status: 'sent',
      messageSid: result.sid,
      idempotencyKey,
      notificationType: 'rent_due',
      messageBody,
    });

    console.log(`✓ SMS sent to tenant: ${property.tenant_name} (${property.property_name})`);
    return { success: true };
  } catch (error: any) {
    console.error(`✗ Failed to send SMS to tenant:`, error);

    await logNotification(supabase, {
      propertyId: property.property_id,
      channel: 'sms',
      recipient: property.tenant_phone,
      status: 'failed',
      errorCode: error.code,
      errorMessage: error.message,
      idempotencyKey,
      notificationType: 'rent_due',
      messageBody,
    });

    return { success: false, error: error.message };
  }
}

/**
 * Sends consolidated SMS to owner
 */
async function sendOwnerConsolidatedSms(
  supabase: ReturnType<typeof getServiceClient>,
  ownerPhone: string,
  properties: PropertyDueToday[]
): Promise<{ success: boolean; error?: string }> {
  const today = new Date();
  const idempotencyKey = generateIdempotencyKey('sms', 'owner-consolidated', ownerPhone, today);

  // Check if already sent
  if (await hasNotificationBeenSent(supabase, idempotencyKey)) {
    console.log(`✓ Consolidated SMS already sent to owner`);
    return { success: true };
  }

  const messageBody = generateOwnerConsolidatedSms(properties);

  try {
    const result = await sendSmsWithFallback({
      to: ownerPhone,
      body: messageBody,
    });

    await logNotification(supabase, {
      channel: 'sms',
      recipient: ownerPhone,
      status: 'sent',
      messageSid: result.sid,
      idempotencyKey,
      notificationType: 'rent_due',
      messageBody,
    });

    console.log(`✓ Consolidated SMS sent to owner: ${properties.length} properties`);
    return { success: true };
  } catch (error: any) {
    console.error(`✗ Failed to send SMS to owner:`, error);

    await logNotification(supabase, {
      channel: 'sms',
      recipient: ownerPhone,
      status: 'failed',
      errorCode: error.code,
      errorMessage: error.message,
      idempotencyKey,
      notificationType: 'rent_due',
      messageBody,
    });

    return { success: false, error: error.message };
  }
}

// ========================================
// API Route Handler
// ========================================

export async function GET(request: NextRequest) {
  console.log('📱 Starting SMS notifications for rent due today...');

  // Verify authorization
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();

  try {
    // Get all properties with rent due today
    const { data: properties, error } = await supabase.rpc('get_properties_due_today');

    if (error) {
      console.error('Error fetching properties:', error);
      return NextResponse.json(
        { error: 'Failed to fetch properties', details: error.message },
        { status: 500 }
      );
    }

    if (!properties || properties.length === 0) {
      console.log('ℹ No properties with rent due today');
      return NextResponse.json({
        success: true,
        message: 'No properties due today',
        tenantsSent: 0,
        ownersSent: 0,
      });
    }

    console.log(`📋 Found ${properties.length} properties with rent due today`);

    // Send SMS to each tenant
    const tenantResults = await Promise.allSettled(
      properties.map((property: PropertyDueToday) => sendTenantSms(supabase, property))
    );

    const tenantsSent = tenantResults.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;

    // Group properties by owner phone
    const propertiesByOwner = properties.reduce((acc: Record<string, PropertyDueToday[]>, property: PropertyDueToday) => {
      if (property.owner_phone) {
        if (!acc[property.owner_phone]) {
          acc[property.owner_phone] = [];
        }
        acc[property.owner_phone].push(property);
      }
      return acc;
    }, {});

    // Send one consolidated SMS per owner
    const ownerResults = await Promise.allSettled(
      (Object.entries(propertiesByOwner) as [string, PropertyDueToday[]][]).map(([ownerPhone, props]) =>
        sendOwnerConsolidatedSms(supabase, ownerPhone, props)
      )
    );

    const ownersSent = ownerResults.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;

    console.log(`✅ Complete: ${tenantsSent} tenants notified, ${ownersSent} owners notified`);

    return NextResponse.json({
      success: true,
      message: 'SMS notifications sent',
      propertiesFound: properties.length,
      tenantsSent,
      ownersSent,
      ownersWithMultipleProperties: Object.keys(propertiesByOwner).length,
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
