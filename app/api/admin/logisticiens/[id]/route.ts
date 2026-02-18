import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function DELETE(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params
        const id = params.id
        console.log("[API Logistique] Attempting DELETE for ID:", id)

        if (!id || id === 'undefined' || id === 'null') {
            return NextResponse.json({ error: 'ID manquant ou invalide' }, { status: 400 })
        }

        // 1. Delete from auth.users
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
        // If user doesn't exist in Auth, we still try to delete profile
        if (authError && !authError.message.includes('User not found')) {
            console.error("[API Delivery] Auth Delete Error:", authError)
        }

        // 2. Delete profile
        const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', id)
        if (profileError) throw profileError

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("[API Delivery] DELETE Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params
        const id = params.id
        console.log("[API Logistique] Attempting PATCH for ID:", id)

        if (!id || id === 'undefined' || id === 'null') {
            return NextResponse.json({ error: 'ID manquant ou invalide' }, { status: 400 })
        }

        const { name, city, phone, password } = await req.json()

        const updateData: any = {
            user_metadata: {
                full_name: name,
                city,
                phone
            }
        }

        if (password) {
            updateData.password = password
        }

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, updateData)
        if (authError) throw authError

        // 2. Update profiles table explicitly
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                name,
                city,
                phone
            })
            .eq('id', id)

        if (profileError) throw profileError

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
