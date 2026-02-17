import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: Request) {
    try {
        const { phone, password, name, city } = await req.json()

        if (!phone || !password || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Clean phone number (remove spaces, etc. to use as identifier)
        const cleanPhone = phone.replace(/\s+/g, '')

        // Supabase Auth requires an email or a phone number. 
        // For phone/password login, we'll use the phone field.
        const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            phone: cleanPhone,
            password,
            phone_confirm: true,
            user_metadata: {
                full_name: name,
                role: 'DELIVERY_MAN',
                city: city,
                phone: phone
            }
        })

        if (authError) {
            // Fallback: If phone/password isn't enabled in Supabase settings yet,
            // we'll use a virtual email phone@delivery.com
            const virtualEmail = `${cleanPhone}@delivery.com`
            const { data: userDataAlt, error: authErrorAlt } = await supabaseAdmin.auth.admin.createUser({
                email: virtualEmail,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name: name,
                    role: 'DELIVERY_MAN',
                    city: city,
                    phone: phone
                }
            })

            if (authErrorAlt) throw authErrorAlt

            // 2. Explicitly insert into profiles to be safe
            const { error: profileErrorAlt } = await supabaseAdmin.from('profiles').upsert({
                id: userDataAlt.user.id,
                name: name,
                role: 'DELIVERY_MAN',
                city: city,
                phone: phone,
                email: virtualEmail
            })

            if (profileErrorAlt) throw profileErrorAlt

            return NextResponse.json({
                success: true,
                message: 'Delivery Man created successfully (via virtual email)',
                user: userDataAlt.user
            })
        }

        // 2. Explicitly insert into profiles to be safe
        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
            id: userData.user.id,
            name: name,
            role: 'DELIVERY_MAN',
            city: city,
            phone: phone
        })

        if (profileError) throw profileError

        return NextResponse.json({
            success: true,
            message: 'Delivery Man created successfully',
            user: userData.user
        })
    } catch (error: any) {
        console.error('Create Delivery Man Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('role', 'DELIVERY_MAN')

        if (error) throw error

        return NextResponse.json({ success: true, deliveryMen: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
