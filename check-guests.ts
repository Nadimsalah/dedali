import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ewrelkbdqzywdjrgsadt.supabase.co'
const supabaseServiceKey = 'sb_secret_Wg0dIyJwQ7jk1mHnH6vJcg_fI8ZQ2BJdonr'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('role', 'customer')

    console.log('Guest Customers Found:', customer?.length)
    if (customer) {
        customer.forEach(c => console.log(` - ${c.name} (${c.email}): MAD ${c.total_spent}`))
    }
}

check()
