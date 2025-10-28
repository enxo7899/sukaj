/**
 * Setup Test Tenant for SMS Notifications
 * 
 * This script helps you:
 * 1. Add yourself as a tenant with today's rent due date
 * 2. Test the SMS notification system
 * 
 * Usage:
 *   tsx scripts/setup-test-tenant.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('🏠 Test Tenant Setup for SMS Notifications\n');
  console.log('This will create a test property with rent due TODAY.\n');

  // Get user inputs
  const propertyName = await question('Property name (e.g., "Test Apartment 1"): ');
  const shortCode = await question('Short code (e.g., "TEST1"): ');
  const tenantName = await question('Your name (tenant): ');
  const tenantPhone = await question('Your phone number (E.164 format, e.g., +355691234567): ');
  const ownerPhone = await question('Owner phone number (E.164 format, e.g., +355691234567): ');
  const rentAmount = await question('Rent amount (e.g., 250): ');
  const currency = await question('Currency (e.g., EUR or ALL): ');

  console.log('\n📝 Creating test property...\n');

  // Get today's date
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  try {
    // Check if property with this short_code already exists
    const { data: existing } = await supabase
      .from('properties')
      .select('id, emertimi')
      .eq('short_code', shortCode)
      .maybeSingle();

    if (existing) {
      console.log(`⚠️  Property with code "${shortCode}" already exists: ${existing.emertimi}`);
      const update = await question('Update this property? (yes/no): ');
      
      if (update.toLowerCase() !== 'yes') {
        console.log('❌ Cancelled');
        rl.close();
        return;
      }

      // Update existing property
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          emertimi: propertyName,
          emri_qiraxhiut: tenantName,
          tel_qiraxhiut: tenantPhone,
          owner_phone: ownerPhone,
          qera_mujore: parseFloat(rentAmount),
          monedha: currency,
          data_qirase: todayStr,
          status: 'Aktive',
          short_code: shortCode,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('❌ Error updating property:', updateError);
        rl.close();
        return;
      }

      console.log('✅ Property updated successfully!');
    } else {
      // Insert new property
      const { data: newProperty, error: insertError } = await supabase
        .from('properties')
        .insert({
          emertimi: propertyName,
          emri_qiraxhiut: tenantName,
          tel_qiraxhiut: tenantPhone,
          owner_phone: ownerPhone,
          qera_mujore: parseFloat(rentAmount),
          monedha: currency,
          data_qirase: todayStr,
          status: 'Aktive',
          short_code: shortCode,
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating property:', insertError);
        rl.close();
        return;
      }

      console.log('✅ Test property created successfully!');
    }

    console.log('\n📋 Summary:');
    console.log(`   Property: ${propertyName}`);
    console.log(`   Code: ${shortCode}`);
    console.log(`   Tenant: ${tenantName}`);
    console.log(`   Tenant Phone: ${tenantPhone}`);
    console.log(`   Owner Phone: ${ownerPhone}`);
    console.log(`   Rent: ${rentAmount} ${currency}`);
    console.log(`   Due Date: ${todayStr} (TODAY)`);

    console.log('\n🎯 Next Steps:');
    console.log('1. Make sure your Twilio credentials are set in .env.local');
    console.log('2. Run the test trigger:');
    console.log('   npm run dev');
    console.log('3. In another terminal, trigger the SMS:');
    console.log('   curl -X GET http://localhost:3001/api/sms/rent-due \\');
    console.log('     -H "Authorization: Bearer YOUR_CRON_SECRET"');
    console.log('\n   Or if CRON_SECRET is not set (dev mode):');
    console.log('   curl -X GET http://localhost:3001/api/sms/rent-due');
    console.log('\n4. Check your phone for SMS notifications! 📱');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  rl.close();
}

main().catch(console.error);
