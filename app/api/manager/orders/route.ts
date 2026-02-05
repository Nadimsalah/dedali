import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const accountManagerId = req.headers.get('x-account-manager-id') || searchParams.get('amId')

        if (!accountManagerId) {
            return NextResponse.json({ error: 'Account Manager ID required' }, { status: 400 })
        }

        // Fetch assigned reseller IDs
        const { data: assignments, error: amError } = await supabaseAdmin
            .from('account_manager_assignments')
            .select('reseller_id')
            .eq('account_manager_id', accountManagerId)
            .is('soft_deleted_at', null)

        if (amError) throw amError

        const resellerIds = assignments?.map(r => r.reseller_id) || []

        if (resellerIds.length === 0) {
            return NextResponse.json({ orders: [] })
        }

        // Smart Discovery: Also fetch emails associated with these resellers
        // This handles cases where orders are created without a reseller_id but belong to the user
        const { data: resellerProfiles } = await supabaseAdmin
            .from('resellers')
            .select('user_id, profile:profiles(email)')
            .in('id', resellerIds)

        const resellerEmails = resellerProfiles
            ?.map((r: any) => r.profile?.email)
            .filter(Boolean) || []

        // Fetch orders belonging to these resellers via ID match OR Email match
        let query = supabaseAdmin
            .from('orders')
            .select(`
                *,
                reseller:resellers (*)
            `)
            .order('created_at', { ascending: false })

        if (resellerEmails.length > 0) {
            // Use OR logic: ID is in list OR Email is in list
            const idsStr = resellerIds.join(',')
            const emailsStr = resellerEmails.map(e => `"${e}"`).join(',')

            query = query.or(`reseller_id.in.(${idsStr}),customer_email.in.(${emailsStr})`)
        } else {
            // Fallback if no emails found (rare)
            query = query.in('reseller_id', resellerIds)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({ orders: data })
    } catch (error: any) {
        console.error('Fetch Orders Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
