'use server'

import { supabaseAdmin } from '@/lib/supabase-server'

export async function getMarketingRecipients() {
    try {
        // 1. Fetch Resellers (Customers with role 'reseller')
        const { data: resellers, error: resError } = await supabaseAdmin
            .from('customers')
            .select('id, name, company_name, phone, role')
            .eq('role', 'reseller')
            .not('phone', 'is', null)

        // 2. Fetch Digital Clients (Customers with role 'customer')
        const { data: customers, error: custError } = await supabaseAdmin
            .from('customers')
            .select('id, name, phone, role')
            .eq('role', 'customer')
            .not('phone', 'is', null)

        // 3. Fetch Commercials (Account Managers from profiles)
        const { data: commercials, error: commError } = await supabaseAdmin
            .from('profiles')
            .select('id, name, phone, role')
            .eq('role', 'ACCOUNT_MANAGER')
            .not('phone', 'is', null)

        return {
            resellers: resellers || [],
            customers: customers || [],
            commercials: commercials || [],
            error: null
        }
    } catch (error: any) {
        console.error('Error fetching marketing recipients:', error)
        return { error: error.message }
    }
}
