'use server'

import { supabaseAdmin } from '@/lib/supabase-server'

export interface DeliveryMan {
    id: string
    name: string
    city?: string
    phone?: string
    is_blocked?: boolean
}

export async function getActiveDeliveryMen(): Promise<{ success: boolean, data?: DeliveryMan[], error?: string }> {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, name, city, phone, is_blocked')
            .eq('role', 'DELIVERY_MAN')
            .eq('is_blocked', false)
            .order('name')

        if (error) {
            console.error('Error fetching delivery men:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data: data as DeliveryMan[] }
    } catch (error: any) {
        console.error('Unexpected error fetching delivery men:', error)
        return { success: false, error: error.message }
    }
}
