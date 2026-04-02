const { createClient } = require('@supabase/supabase-js')
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function debug() {
  const { data: allO } = await s.from('orders')
    .select('order_number, customer_email, customer_name, customer_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
  
  console.log('ALL orders (newest first):')
  for (const o of allO) {
    console.log(`  ${o.order_number} | ${o.customer_email} | ${o.customer_name} | cid: ${o.customer_id} | ${o.created_at}`)
  }
}

debug()
