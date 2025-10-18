import { Property } from '@/types/property';

// Email service using Resend (you'll need to install: pnpm add resend)
// For now, this is a template - you can switch to any email service

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  type: 'reminder_3_days' | 'reminder_1_day' | 'due_today' | 'overdue_1_day' | 'weekly_summary';
}

export class EmailService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
  }

  async sendEmail(notification: EmailNotification): Promise<boolean> {
    try {
      // Using Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Sukaj Prona <notifications@sukaj.com>',
          to: notification.to,
          subject: notification.subject,
          html: notification.html,
        }),
      });

      if (!response.ok) {
        console.error('Email send failed:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Email error:', error);
      return false;
    }
  }

  // For testing/development - log emails instead of sending
  async logEmail(notification: EmailNotification): Promise<boolean> {
    console.log('📧 EMAIL NOTIFICATION:');
    console.log('To:', notification.to);
    console.log('Subject:', notification.subject);
    console.log('Type:', notification.type);
    console.log('---');
    return true;
  }
}

export function generateReminderEmail(
  properties: Property[],
  type: EmailNotification['type']
): string {
  const titles = {
    reminder_3_days: '🔔 Kujtesë: Qiraja skadon pas 3 ditësh',
    reminder_1_day: '⚠️ Urgjente: Qiraja skadon nesër',
    due_today: '📅 Qiraja duhet paguar sot',
    overdue_1_day: '❌ Qiraja është në vonesë',
    weekly_summary: '📊 Përmbledhje javore - Qirat e papaguara',
  };

  const intro = {
    reminder_3_days: 'Përshëndetje! Këto prona kanë qira që skadon pas 3 ditësh:',
    reminder_1_day: 'Kujdes! Qiraja për këto prona skadon nesër:',
    due_today: 'Qiraja për këto prona duhet paguar SOT:',
    overdue_1_day: 'VËMENDJE: Këto qira janë në vonesë 1 ditë:',
    weekly_summary: 'Këto prona kanë qira të papaguara këtë javë:',
  };

  const propertyRows = properties.map(p => {
    const amount = p.qera_mujore 
      ? `${p.qera_mujore.toLocaleString('en-US').replace(/,/g, ' ')} ${p.monedha || 'EUR'}`
      : 'N/A';
    
    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 16px; font-weight: 500;">${p.emertimi}</td>
        <td style="padding: 12px 16px;">${p.emri_qiraxhiut || '-'}</td>
        <td style="padding: 12px 16px;">${p.tel_qiraxhiut || '-'}</td>
        <td style="padding: 12px 16px; font-weight: 600; color: #059669;">${amount}</td>
        <td style="padding: 12px 16px;">${formatDateAlbanian(p.data_qirase)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${titles[type]}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 800px; margin: 0 auto; background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏢 Sukaj Prona</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${titles[type]}</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">${intro[type]}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #6b7280;">Prona</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #6b7280;">Qiraxhiu</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #6b7280;">Telefon</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #6b7280;">Qiraja</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #6b7280;">Data</th>
              </tr>
            </thead>
            <tbody>
              ${propertyRows}
            </tbody>
          </table>

          <div style="margin-top: 30px; padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              💡 <strong>Tip:</strong> Klikoni butonin më poshtë për të hapur aplikacionin dhe përditësuar statusin e pagesës.
            </p>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/prona" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Hap Dashboard →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            © 2025 Sukaj Properties. Të gjitha të drejtat e rezervuara.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
            Ky email u dërgua automatikisht nga sistemi i menaxhimit të pronave.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function formatDateAlbanian(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const months = [
    'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
    'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
  ];
  
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
