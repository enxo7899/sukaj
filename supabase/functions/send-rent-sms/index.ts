import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') ?? ''
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') ?? ''
const TWILIO_MSG_SERVICE_SID = Deno.env.get('TWILIO_MSG_SERVICE_SID') ?? ''

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const today = new Date().toISOString().split('T')[0]
    const currentDay = new Date().getDate()

    // STEP 1: Get ALL properties with a rent due date (regardless of status)
    const { data: allProperties, error } = await supabaseClient
      .from('properties')
      .select('*')
      .not('data_qirase', 'is', null)

    if (error) throw error

    // STEP 2: Filter properties where due date is today
    const propertiesDueToday = allProperties?.filter(p => {
      const rentDay = new Date(p.data_qirase).getDate()
      return rentDay === currentDay
    }) || []

    // STEP 3: Auto-reset status to "Pa Paguar" for properties that are marked "Paguar" but due today
    // This ensures rent automatically becomes unpaid when new month arrives
    const propertiesToReset = propertiesDueToday.filter(p => p.status === 'Paguar')
    for (const property of propertiesToReset) {
      await supabaseClient
        .from('properties')
        .update({ status: 'Pa Paguar' })
        .eq('id', property.id)
    }

    // STEP 4: Now filter to only "Pa Paguar" properties (includes the ones we just reset)
    const filtered = propertiesDueToday.filter(p => 
      p.status === 'Pa Paguar' || propertiesToReset.some(r => r.id === p.id)
    )

    const results = []
    
    // Process each property and send tenant SMS
    for (const property of filtered) {
      await supabaseClient.from('rental_payments').insert({
        property_id: property.id,
        tenant_name: property.emri_qiraxhiut,
        tenant_phone: property.tel_qiraxhiut,
        rent_amount: property.qera_mujore,
        currency: property.monedha,
        payment_due_date: today,
        status: 'Pa Paguar',
        property_name: property.emertimi,
        notes: 'Auto-created by Edge Function'
      })

      if (property.tel_qiraxhiut) {
        // CUSTOMIZE TENANT MESSAGE HERE ⬇️
        const tenantMessage = `Përshëndetje ${property.emri_qiraxhiut},\nDëshirojmë t'ju kujtojmë për kryerjen e pagesës së qirasë për muajin aktual për pronën ${property.emertimi}.\nJu faleminderit për bashkëpunimin dhe mirëkuptimin!\nMe respekt,\nLindita Sukaj`
        
        const tenantResult = await sendTwilioSMS(property.tel_qiraxhiut, tenantMessage)
        results.push({ type: 'tenant', property: property.emertimi, result: tenantResult })
      }
    }

    // Group properties by owner and send ONE SMS per owner
    const propertiesByOwner = {}
    for (const property of filtered) {
      if (property.owner_phone) {
        if (!propertiesByOwner[property.owner_phone]) {
          propertiesByOwner[property.owner_phone] = []
        }
        propertiesByOwner[property.owner_phone].push(property)
      }
    }

    // Send one consolidated SMS per owner
    for (const [ownerPhone, properties] of Object.entries(propertiesByOwner)) {
      // CUSTOMIZE OWNER MESSAGE HERE ⬇️
      let ownerMessage = `Kujtesë: ${properties.length} qira përfundon${properties.length > 1 ? 'në' : ''} sot:\n\n`
      
      properties.forEach((prop, index) => {
        ownerMessage += `${index + 1}. ${prop.emertimi}\n`
        ownerMessage += `   Qiramarrës: ${prop.emri_qiraxhiut}\n`
        ownerMessage += `   Tel: ${prop.tel_qiraxhiut}\n`
        ownerMessage += `   Shuma: ${prop.qera_mujore} ${prop.monedha}\n\n`
      })
      
      ownerMessage += '- Sukaj SHPK'
      
      const ownerResult = await sendTwilioSMS(ownerPhone, ownerMessage)
      results.push({ 
        type: 'owner_summary', 
        owner: ownerPhone, 
        properties_count: properties.length,
        result: ownerResult 
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        properties_processed: filtered.length,
        results
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function sendTwilioSMS(to, message) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
  const body = new URLSearchParams({
    To: to,
    MessagingServiceSid: TWILIO_MSG_SERVICE_SID,
    Body: message
  })
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  })
  const data = await response.json()
  return { to, status: response.status, sid: data.sid, success: response.ok }
}
