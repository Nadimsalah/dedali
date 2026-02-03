import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ewrelkbdqzywdjrgsadt.supabase.co'
const supabaseServiceKey = 'sb_secret_Wg0dIyJwQ7jk1mHnH6vJcg_fI8ZQ2BJdonr'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('*')

        if (error) {
            console.error('Error:', error)
            return
        }

        console.log('Total entries in customers table:', data?.length)
        data?.forEach(c => {
            console.log(`- ID: ${c.id}, Name: ${c.name}, Email: ${c.email}, Role: ${c.role}, Status: ${c.status}`)
        })
    } catch (e) {
        console.error('Exception:', e)
    }
}

check()
