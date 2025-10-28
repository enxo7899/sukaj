/**
 * Messaging System Test Script
 * 
 * Tests the messaging system components locally
 * Run: pnpm tsx scripts/test-messaging.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { getTwilioConfig } from '../src/lib/twilio';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function testDatabaseSchema() {
  section('📊 Testing Database Schema');

  const tests = [
    {
      name: 'properties.short_code column exists',
      query: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'short_code'
      `,
    },
    {
      name: 'properties.owner_phone column exists',
      query: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'owner_phone'
      `,
    },
    {
      name: 'kontratat.tel_qera_marres column exists',
      query: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'kontratat' AND column_name = 'tel_qera_marres'
      `,
    },
    {
      name: 'rent_notifications table exists',
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'rent_notifications'
      `,
    },
    {
      name: 'get_properties_due_today function exists',
      query: `
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_name = 'get_properties_due_today'
      `,
    },
    {
      name: 'get_contracts_expiring_soon function exists',
      query: `
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_name = 'get_contracts_expiring_soon'
      `,
    },
  ];

  for (const test of tests) {
    const { data, error } = await supabase.rpc('execute_sql', {
      query: test.query,
    }).single();

    if (error || !data) {
      log(`❌ ${test.name}`, 'red');
      if (error) console.error(error);
    } else {
      log(`✅ ${test.name}`, 'green');
    }
  }
}

async function testTwilioConfig() {
  section('🔧 Testing Twilio Configuration');

  const requiredVars = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_MSG_SERVICE_SID',
    'ALPHA_SENDER_NAME',
  ];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      log(`✅ ${varName} is set`, 'green');
    } else {
      log(`❌ ${varName} is missing`, 'red');
    }
  }

  try {
    const config = getTwilioConfig();
    log(`\n✅ Twilio config loaded successfully`, 'green');
    log(`   Account SID: ${config.accountSid.substring(0, 10)}...`, 'blue');
    log(`   Messaging Service: ${config.messagingServiceSid.substring(0, 10)}...`, 'blue');
    log(`   Alpha Sender: ${config.alphaSenderName}`, 'blue');
    log(`   Use Alpha Sender: ${config.useAlphanumericSender}`, 'blue');
  } catch (error: any) {
    log(`❌ Failed to load Twilio config: ${error.message}`, 'red');
  }
}

async function testDataPreparation() {
  section('📋 Testing Data Preparation');

  // Check properties with short codes
  const { data: propertiesWithCodes, error: e1 } = await supabase
    .from('properties')
    .select('id, emertimi, short_code, owner_phone, tel_qiraxhiut, data_qirase')
    .eq('status', 'Aktive')
    .not('short_code', 'is', null);

  if (e1) {
    log(`❌ Error fetching properties: ${e1.message}`, 'red');
  } else {
    log(`✅ Found ${propertiesWithCodes?.length || 0} properties with short codes`, 'green');
    
    if (propertiesWithCodes && propertiesWithCodes.length > 0) {
      log('\nSample properties:', 'yellow');
      propertiesWithCodes.slice(0, 3).forEach((p: any) => {
        console.log(`  - ${p.emertimi} [${p.short_code}]`);
        console.log(`    Owner: ${p.owner_phone || 'NOT SET'}`);
        console.log(`    Tenant: ${p.tel_qiraxhiut || 'NOT SET'}`);
        console.log(`    Due Date: ${p.data_qirase || 'NOT SET'}`);
      });
    }
  }

  // Check for missing data
  const { data: missingCodes, error: e2 } = await supabase
    .from('properties')
    .select('id, emertimi')
    .eq('status', 'Aktive')
    .is('short_code', null);

  if (!e2 && missingCodes && missingCodes.length > 0) {
    log(`\n⚠️  ${missingCodes.length} active properties missing short_code`, 'yellow');
  }

  const { data: missingOwnerPhone, error: e3 } = await supabase
    .from('properties')
    .select('id, emertimi')
    .eq('status', 'Aktive')
    .is('owner_phone', null);

  if (!e3 && missingOwnerPhone && missingOwnerPhone.length > 0) {
    log(`⚠️  ${missingOwnerPhone.length} active properties missing owner_phone`, 'yellow');
  }
}

async function testDatabaseFunctions() {
  section('🔍 Testing Database Functions');

  // Test get_properties_due_today
  const { data: dueToday, error: e1 } = await supabase
    .rpc('get_properties_due_today');

  if (e1) {
    log(`❌ get_properties_due_today() failed: ${e1.message}`, 'red');
  } else {
    log(`✅ get_properties_due_today() executed successfully`, 'green');
    log(`   Found ${dueToday?.length || 0} properties due today`, 'blue');
    
    if (dueToday && dueToday.length > 0) {
      log('\nProperties due today:', 'yellow');
      dueToday.forEach((p: any) => {
        console.log(`  - ${p.property_name} [${p.property_short_code || 'NO CODE'}]`);
        console.log(`    Tenant: ${p.tenant_name || 'N/A'} (${p.tenant_phone || 'NO PHONE'})`);
        console.log(`    Owner: ${p.owner_phone || 'NO PHONE'}`);
      });
    }
  }

  // Test get_contracts_expiring_soon
  const { data: expiringContracts, error: e2 } = await supabase
    .rpc('get_contracts_expiring_soon');

  if (e2) {
    log(`❌ get_contracts_expiring_soon() failed: ${e2.message}`, 'red');
  } else {
    log(`\n✅ get_contracts_expiring_soon() executed successfully`, 'green');
    log(`   Found ${expiringContracts?.length || 0} contracts expiring in 30 days`, 'blue');
    
    if (expiringContracts && expiringContracts.length > 0) {
      log('\nContracts expiring soon:', 'yellow');
      expiringContracts.forEach((c: any) => {
        console.log(`  - ${c.property_name} [${c.property_short_code || 'NO CODE'}]`);
        console.log(`    Expires: ${c.expiry_date}`);
        console.log(`    Owner: ${c.owner_phone || 'NO PHONE'}`);
      });
    }
  }
}

async function testNotificationLog() {
  section('📬 Testing Notification Log');

  const { data: recentNotifications, error } = await supabase
    .from('rent_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    log(`❌ Error fetching notifications: ${error.message}`, 'red');
  } else {
    log(`✅ Found ${recentNotifications?.length || 0} recent notifications`, 'green');
    
    if (recentNotifications && recentNotifications.length > 0) {
      log('\nRecent notifications:', 'yellow');
      recentNotifications.forEach((n: any) => {
        console.log(`  - ${n.channel.toUpperCase()} to ${n.recipient}`);
        console.log(`    Status: ${n.status}`);
        console.log(`    Type: ${n.notification_type}`);
        console.log(`    Created: ${new Date(n.created_at).toLocaleString()}`);
      });
    }
  }
}

async function main() {
  log('\n🚀 Messaging System Test Suite\n', 'cyan');
  
  try {
    await testDatabaseSchema();
    await testTwilioConfig();
    await testDataPreparation();
    await testDatabaseFunctions();
    await testNotificationLog();

    section('✅ Test Suite Complete');
    log('All tests completed. Review results above.', 'green');
    log('\nNext steps:', 'yellow');
    console.log('1. Fix any ❌ errors shown above');
    console.log('2. Add missing short codes and phone numbers');
    console.log('3. Test cron endpoints manually: pnpm test:cron');
    console.log('4. See MESSAGING_SYSTEM_SETUP.md for full testing workflow\n');
  } catch (error: any) {
    log(`\n❌ Test suite failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
