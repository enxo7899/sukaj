import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { EmailService, generateReminderEmail, type EmailNotification } from '@/lib/email';
import { Property } from '@/types/property';

// This API route should be called by a cron job service (Vercel Cron, GitHub Actions, or external cron)
export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emailService = new EmailService();
    const notifications: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get owner email (you can make this configurable per property later)
    const ownerEmail = process.env.OWNER_EMAIL || 'owner@sukaj.com';

    // 1. Check for rent due in 3 days
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const properties3Days = await getPropertiesByDueDate(threeDaysLater);
    
    if (properties3Days.length > 0) {
      const html = generateReminderEmail(properties3Days, 'reminder_3_days');
      const sent = await emailService.sendEmail({
        to: ownerEmail,
        subject: '🔔 Kujtesë: Qiraja skadon pas 3 ditësh',
        html,
        type: 'reminder_3_days',
      });
      
      if (sent) {
        await logNotifications(properties3Days, 'reminder_3_days', ownerEmail);
        notifications.push({ type: 'reminder_3_days', count: properties3Days.length });
      }
    }

    // 2. Check for rent due in 1 day
    const oneDayLater = new Date(today);
    oneDayLater.setDate(oneDayLater.getDate() + 1);
    const properties1Day = await getPropertiesByDueDate(oneDayLater);
    
    if (properties1Day.length > 0) {
      const html = generateReminderEmail(properties1Day, 'reminder_1_day');
      const sent = await emailService.sendEmail({
        to: ownerEmail,
        subject: '⚠️ Urgjente: Qiraja skadon nesër',
        html,
        type: 'reminder_1_day',
      });
      
      if (sent) {
        await logNotifications(properties1Day, 'reminder_1_day', ownerEmail);
        notifications.push({ type: 'reminder_1_day', count: properties1Day.length });
      }
    }

    // 3. Check for rent due TODAY
    const propertiesToday = await getPropertiesByDueDate(today);
    
    if (propertiesToday.length > 0) {
      const html = generateReminderEmail(propertiesToday, 'due_today');
      const sent = await emailService.sendEmail({
        to: ownerEmail,
        subject: '📅 Qiraja duhet paguar sot',
        html,
        type: 'due_today',
      });
      
      if (sent) {
        await logNotifications(propertiesToday, 'due_today', ownerEmail);
        notifications.push({ type: 'due_today', count: propertiesToday.length });
      }
    }

    // 4. Check for overdue (1 day past due date, still unpaid)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const propertiesOverdue = await getOverdueProperties(yesterday);
    
    if (propertiesOverdue.length > 0) {
      const html = generateReminderEmail(propertiesOverdue, 'overdue_1_day');
      const sent = await emailService.sendEmail({
        to: ownerEmail,
        subject: '❌ Qiraja është në vonesë',
        html,
        type: 'overdue_1_day',
      });
      
      if (sent) {
        await logNotifications(propertiesOverdue, 'overdue_1_day', ownerEmail);
        notifications.push({ type: 'overdue_1_day', count: propertiesOverdue.length });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      notifications,
      message: `Sent ${notifications.length} notification types`,
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

// Helper functions
async function getPropertiesByDueDate(date: Date): Promise<Property[]> {
  const dateStr = date.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('data_qirase', dateStr)
    .eq('status', 'Pa Paguar');

  if (error) {
    console.error('Error fetching properties:', error);
    return [];
  }

  return (data as Property[]) || [];
}

async function getOverdueProperties(date: Date): Promise<Property[]> {
  const dateStr = date.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('data_qirase', dateStr)
    .eq('status', 'Pa Paguar');

  if (error) {
    console.error('Error fetching overdue properties:', error);
    return [];
  }

  return (data as Property[]) || [];
}

async function logNotifications(
  properties: Property[],
  type: EmailNotification['type'],
  recipientEmail: string
) {
  const records = properties.map(p => ({
    property_id: p.id,
    notification_type: type,
    recipient_email: recipientEmail,
    property_name: p.emertimi,
    tenant_name: p.emri_qiraxhiut,
    rent_amount: p.qera_mujore,
    currency: p.monedha,
    payment_due_date: p.data_qirase,
    status: p.status,
    email_subject: getEmailSubject(type),
    email_sent_successfully: true,
  }));

  await supabase.from('rent_notifications').insert(records);
}

function getEmailSubject(type: EmailNotification['type']): string {
  const subjects = {
    reminder_3_days: '🔔 Kujtesë: Qiraja skadon pas 3 ditësh',
    reminder_1_day: '⚠️ Urgjente: Qiraja skadon nesër',
    due_today: '📅 Qiraja duhet paguar sot',
    overdue_1_day: '❌ Qiraja është në vonesë',
    weekly_summary: '📊 Përmbledhje javore - Qirat e papaguara',
  };
  return subjects[type];
}
