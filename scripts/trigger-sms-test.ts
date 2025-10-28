/**
 * Manual SMS Trigger for Testing
 * 
 * This script allows you to manually trigger SMS notifications
 * at any time for testing purposes.
 * 
 * Usage:
 *   tsx scripts/trigger-sms-test.ts
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
const CRON_SECRET = process.env.CRON_SECRET;

async function triggerSms() {
  console.log('📱 Triggering SMS notifications...\n');
  console.log(`Target URL: ${APP_URL}/api/sms/rent-due`);

  try {
    const headers: Record<string, string> = {};
    
    if (CRON_SECRET) {
      headers['Authorization'] = `Bearer ${CRON_SECRET}`;
      console.log('🔐 Using CRON_SECRET for authorization');
    } else {
      console.log('⚠️  No CRON_SECRET found - running in dev mode');
    }

    const response = await fetch(`${APP_URL}/api/sms/rent-due`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ Success!');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.propertiesFound === 0) {
        console.log('\nℹ️  No properties found with rent due today.');
        console.log('💡 Run: tsx scripts/setup-test-tenant.ts to create a test property');
      } else {
        console.log(`\n📊 Results:`);
        console.log(`   Properties found: ${data.propertiesFound}`);
        console.log(`   Tenants notified: ${data.tenantsSent}`);
        console.log(`   Owners notified: ${data.ownersSent}`);
        console.log(`\n✨ Check your phone for SMS messages!`);
      }
    } else {
      console.error('\n❌ Error:', data);
      
      if (response.status === 401) {
        console.log('\n💡 Tip: Make sure CRON_SECRET matches in .env.local');
      }
    }
  } catch (error: any) {
    console.error('\n❌ Failed to trigger SMS:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your development server is running:');
      console.log('   npm run dev');
    }
  }
}

triggerSms().catch(console.error);
