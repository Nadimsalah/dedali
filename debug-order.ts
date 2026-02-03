import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugOrder() {
    const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', 'ORD-4314')
        .single()

    console.log('Order Info:', order)

    if (order?.customer_id) {
        const { data: customer } = await supabase
            .from('customers')
            .select('*')
            .eq('id', order.customer_id)
            .single()
        console.log('Customer Info:', customer)
    } else {
        const { data: customer } = await supabase
            .from('customers')
            .select('*')
            .eq('email', order?.customer_email)
            .maybeSingle()
        console.log('Customer found by email:', customer)
    }
}

debugOrder()
