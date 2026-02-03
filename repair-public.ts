import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ewrelkbdqzywdjrgsadt.supabase.co'
const supabaseAnonKey = 'sb_publishable_hWakXphh0eSr3vVbg82w1g_VsEd21D4'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function repair() {
    console.log('Starting Public Repair...')

    // 1. Get all orders
    const { data: orders } = await supabase
        .from('orders')
        .select('*')

    if (!orders) {
        console.log('No orders found.')
        return;
    }

    console.log(`Scanning ${orders.length} orders...`)

    for (const order of orders) {
        // We only care about orders that don't have a linked customer
        // OR we want to ensure the customer exists.

        const normalizedEmail = order.customer_email.toLowerCase().trim()

        // Find customer by email
        const { data: customer } = await supabase
            .from('customers')
            .select('*')
            .eq('email', normalizedEmail)
            .maybeSingle()

        let customerId = customer?.id;

        if (!customer) {
            console.log(`Creating customer for ${normalizedEmail}...`)
            const { data: newCust, error } = await supabase
                .from('customers')
                .insert({
                    name: order.customer_name,
                    email: normalizedEmail,
                    phone: order.customer_phone,
                    role: 'customer',
                    status: 'active',
                    total_orders: 1,
                    total_spent: order.total
                })
                .select()
                .single()

            if (error) {
                console.error('Failed to create customer:', error)
                continue
            }
            customerId = newCust.id;
        }

        // Check if order is linked correctly
        if (order.customer_id !== customerId) {
            console.log(`Linking Order ${order.order_number} to Customer ${customerId}...`)
            const { error: updateError } = await supabase
                .from('orders')
                .update({ customer_id: customerId })
                .eq('id', order.id)
                .select()

            if (updateError) {
                console.error('Failed to link order:', updateError)
            }
        }

        // Update stats while we are here (simple incremental approach or recalculate)
        // For now, let's just ensure linkage so they appear in the list.
        // The stats on the page are aggregating from the customer record, so we might need to fix that too.
    }

    console.log('Repair Complete. Recalculating totals...')

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

    console.log('Stats Updated.')
}

repair()
