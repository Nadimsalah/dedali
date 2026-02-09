
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Simple env parser
const envPath = path.resolve(__dirname, '.env.local')
let env = {}
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
        }
    })
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrders() {
    console.log('Checking orders table...')

    // Get all orders
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, customer_id, customer_email, status')

    if (error) {
        console.error('Error fetching orders:', error)
        return
    }

    const { data: resellers, error: resellerError } = await supabase
        .from('customers')
        .select('id')
        .eq('role', 'reseller')

    if (resellerError) {
        console.error(resellerError)
        return
    }

    const resellerIds = new Set(resellers ? resellers.map(r => r.id) : [])

    let guestOrdersCount = 0

    if (orders) {
        orders.forEach(o => {
            if (!o.customer_id || !resellerIds.has(o.customer_id)) {
                guestOrdersCount++
            }
        })
    }

    console.log(`Reseller Count: ${Object.keys(resellers || {}).length}`)
    console.log(`Guest/Direct Orders (not linked to known reseller): ${guestOrdersCount}`)
}

checkOrders()
