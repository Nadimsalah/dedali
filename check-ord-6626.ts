import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkOrder() {
    const { data: order, error } = await supabase
        .from('orders')
        .select('*, customers(*)')
        .eq('order_number', 'ORD-6626')
        .single()

    if (error) {
        console.log('Error fetching order:', error)
        return
    }

    console.log('Order Data:', order)
    if (order.customers) {
        console.log('Linked Customer:', order.customers)
    } else {
        console.log('No linked customer found via join.')
        if (order.customer_id) {
            console.log('Has customer_id:', order.customer_id, 'but join failed.')
        } else {
            console.log('No customer_id on order.')
        }
    }
}

checkOrder()
