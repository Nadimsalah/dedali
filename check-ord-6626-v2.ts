import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ewrelkbdqzywdjrgsadt.supabase.co'
const supabaseAnonKey = 'sb_publishable_hWakXphh0eSr3vVbg82w1g_VsEd21D4'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkOrder() {
    const { data: order, error } = await supabase
        .from('orders')
        .select('*, customers(*)')
        .eq('order_number', 'ORD-6626')
        .maybeSingle()

    if (error) {
        console.log('Error fetching order:', error)
        return
    }

    if (!order) {
        console.log('Order ORD-6626 not found.')
        return
    }

    console.log('Order Data:', {
        id: order.id,
        order_number: order.order_number,
        customer_email: order.customer_email,
        customer_id: order.customer_id
    })

    if (order.customers) {
        console.log('Linked Customer:', JSON.stringify(order.customers, null, 2))
    } else {
        console.log('No linked customer found via join.')
    }
}

checkOrder()
