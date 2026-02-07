'use server'

import { supabaseAdmin } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatusAdmin(orderId: string, status: string, actorId?: string) {
    console.log(`[Admin Action] Updating order ${orderId} to status: ${status} by ${actorId || 'system'}`)

    try {
        // 1. Get Old Status for Log
        const { data: oldOrder } = await supabaseAdmin
            .from('orders')
            .select('status')
            .eq('id', orderId)
            .single()

        const oldStatus = oldOrder?.status || 'unknown'

        // 2. Update Order Status
        const { data, error } = await supabaseAdmin
            .from('orders')
            .update({
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .select()
            .single()

        if (error) {
            console.error('[Admin Action] Error updating order status:', error)
            return { error: error.message }
        }

        // 3. Manually Insert Log (Trusting the provided actorId)
        if (actorId) {
            await supabaseAdmin.from('order_status_logs').insert({
                order_id: orderId,
                changed_by: actorId,
                old_status: oldStatus,
                new_status: status
            })
        }

        revalidatePath('/admin/orders/[id]')
        revalidatePath('/manager/orders/[orderId]')

        return { success: true, data }
    } catch (e: any) {
        console.error('[Admin Action] Unexpected error:', e)
        return { error: e.message || 'An unexpected error occurred' }
    }
}

export async function getOrderDetailsAdmin(orderId: string) {
    console.log(`[Admin Action] Fetching order details for: ${orderId}`)
    try {
        // Fetch Order with relations
        console.log('[Admin Action] querying orders table...')
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                reseller:resellers (
                    id,
                    company_name,
                    profile:profiles (name, email, phone)
                )
            `)
            .eq('id', orderId)
            .single()

        if (orderError) throw orderError
        if (!order) throw new Error('Order not found')

        // Fetch Items
        const { data: items, error: itemsError } = await supabaseAdmin
            .from('order_items')
            .select('*')
            .eq('order_id', orderId)

        if (itemsError) throw itemsError

        // Fetch Notes
        const { data: notes, error: notesError } = await supabaseAdmin
            .from('order_internal_notes')
            .select('*, author:profiles(name)')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false })

        if (notesError) throw notesError

        // Fetch Logs
        const { data: logs, error: logsError } = await supabaseAdmin
            .from('order_status_logs')
            .select('*, changed_by_user:profiles(name)')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false })

        if (logsError) throw logsError

        // ----------------------------------------------------
        // BUILD VIEW MODEL (Flattened & Guaranteed Data)
        // ----------------------------------------------------

        // 1. Determine Company Name & Reseller Name
        let companyName = "Direct Customer"
        let resellerName = "None"

        // Logical Flow:
        // A. Has Direct Reseller Link -> Use it
        // B. Has Reseller ID but Link Failed -> Manual Fetch
        // C. Smart Discovery via Email -> If email matches a Reseller profile, use that info
        // D. Fallback -> Customer Name

        if (order.reseller) {
            companyName = order.reseller.company_name || "Un-named Company"
            const pName = Array.isArray(order.reseller.profile)
                ? order.reseller.profile[0]?.name
                : order.reseller.profile?.name
            resellerName = pName || "Unknown Reseller"
        } else if (order.reseller_id) {
            // Fallback for ID-only case
            try {
                const { data: rData } = await supabaseAdmin
                    .from('resellers')
                    .select('company_name, profile:profiles(name)')
                    .eq('id', order.reseller_id)
                    .single()
                if (rData) {
                    companyName = rData.company_name || "Un-named Company"
                    // Fix: Profile handling
                    const pName = Array.isArray(rData.profile)
                        ? rData.profile[0]?.name
                        : rData.profile?.name
                    resellerName = pName || "Unknown Reseller"
                    order.reseller = rData
                }
            } catch (err) { console.error("Fallback fetch failed", err) }
        } else if (order.customer_email) {
            // Smart Discovery: Check if the customer_email belongs to a reseller
            try {
                // 1. Find profile by email
                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('email', order.customer_email)
                    .single()

                if (profile) {
                    // 2. Find reseller by user_id (profile id)
                    const { data: rData } = await supabaseAdmin
                        .from('resellers')
                        .select('id, company_name, profile:profiles(name)')
                        .eq('user_id', profile.id)
                        .single()

                    if (rData) {
                        companyName = rData.company_name || "Un-named Company"
                        const pName = Array.isArray(rData.profile)
                            ? rData.profile[0]?.name
                            : rData.profile?.name
                        resellerName = pName || "Unknown Reseller"
                        order.reseller = rData
                    } else if (order.customer_name) {
                        companyName = order.customer_name
                    }
                } else if (order.customer_name) {
                    companyName = order.customer_name
                }
            } catch (err) {
                if (order.customer_name) companyName = order.customer_name
            }
        } else if (order.customer_name) {
            companyName = order.customer_name
        }

        // 2. Format Items
        const formattedItems = items.map((item: any) => ({
            ...item,
            image_url: item.product_image || null,
            final_price: item.price
        }))

        // 3. Return Clean Object
        return {
            success: true,
            data: {
                ...order,
                display_company_name: companyName,
                display_reseller_name: resellerName,
                items: formattedItems,
                notes,
                auditLogs: logs
            }
        }

    } catch (e: any) {
        console.error('[Admin Action] Error fetching order details:', e)
        return { error: e.message || 'Failed to fetch order details' }
    }
}
