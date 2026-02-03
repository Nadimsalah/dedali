import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ewrelkbdqzywdjrgsadt.supabase.co'
const supabaseAnonKey = 'sb_publishable_hWakXphh0eSr3vVbg82w1g_VsEd21D4'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// UUID Shim if uuid package not available
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function repair() {
    console.log('Starting Public Repair (with ID generation)...')

    // 1. Get all orders
    const { data: orders } = await supabase
        .from('orders')
        .select('*')

    if (!orders) return;

    for (const order of orders) {
        const normalizedEmail = order.customer_email.toLowerCase().trim()

        const { data: customer } = await supabase
            .from('customers')
            .select('*')
            .eq('email', normalizedEmail)
            .maybeSingle()

        let customerId = customer?.id;

        if (!customer) {
            const newId = generateUUID();
            console.log(`Creating customer for ${normalizedEmail} with ID ${newId}...`)

            const { data: newCust, error } = await supabase
                .from('customers')
                .insert({
                    id: newId,
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

        if (order.customer_id !== customerId) {
            console.log(`Linking Order ${order.order_number} to Customer ${customerId}...`)
            await supabase
                .from('orders')
                .update({ customer_id: customerId })
                .eq('id', order.id)
        }
    }

    console.log('Finalizing stats...')
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
    console.log('Done.')
}

repair()
