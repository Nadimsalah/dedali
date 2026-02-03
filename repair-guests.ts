import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ewrelkbdqzywdjrgsadt.supabase.co'
const supabaseServiceKey = 'sb_secret_Wg0dIyJwQ7jk1mHnH6vJcg_fI8ZQ2BJdonr'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function repair() {
    console.log('Starting Guest Account Repair...')

    // 1. Get all orders without a valid customer_id association in the customers table
    // (Actually just get all orders and we will manually check)
    const { data: orders } = await supabase
        .from('orders')
        .select('*')

    if (!orders) return;

    for (const order of orders) {
        console.log(`Processing Order ${order.order_number} (${order.customer_email})...`)

        // Check if customer exists
        const { data: customer } = await supabase
            .from('customers')
            .select('*')
            .eq('email', order.customer_email.toLowerCase().trim())
            .maybeSingle()

        if (!customer) {
            console.log(`  Creating missing guest record for ${order.customer_email}`)
            const { data: newCust, error } = await supabase
                .from('customers')
                .insert({
                    name: order.customer_name,
                    email: order.customer_email.toLowerCase().trim(),
                    phone: order.customer_phone,
                    role: 'customer',
                    status: 'active',
                    total_orders: 1,
                    total_spent: order.total
                })
                .select()
                .single()

            if (newCust) {
                // Update order to link it
                await supabase.from('orders').update({ customer_id: newCust.id }).eq('id', order.id)
            }
        } else {
            // Customer exists, link if not linked
            if (!order.customer_id) {
                console.log(`  Linking existing customer to order ${order.order_number}`)
                await supabase.from('orders').update({ customer_id: customer.id }).eq('id', order.id)
            }

            // Note: We don't update stats here to avoid double counting if they are already correct
            // but for a repair, we might want to recalculate stats later.
        }
    }

    // 2. Recalculate all customer stats to be sure
    console.log('Recalculating stats...')
    const { data: allCustomers } = await supabase.from('customers').select('id')
    if (allCustomers) {
        for (const c of allCustomers) {
            const { data: cOrders } = await supabase.from('orders').select('total').eq('customer_id', c.id)
            if (cOrders) {
                const totalOrders = cOrders.length;
                const totalSpent = cOrders.reduce((sum, o) => sum + Number(o.total), 0)
                await supabase.from('customers').update({ total_orders: totalOrders, total_spent: totalSpent }).eq('id', c.id)
            }
        }
    }

    console.log('Repair Complete!')
}

repair()
