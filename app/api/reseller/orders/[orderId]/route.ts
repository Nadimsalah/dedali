import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await context.params
        const authHeader = req.headers.get("authorization") || ""
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
        if (authError || !authData.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = authData.user

        const { data: order, error: orderError } = await supabaseAdmin
            .from("orders")
            .select(`
                *,
                order_items (*),
                notes:order_internal_notes (*, author:profiles(name)),
                reseller:resellers (*, profile:profiles(name))
            `)
            .eq("id", orderId)
            .single()

        if (orderError || !order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }

        const emailMatches = !!user.email && order.customer_email?.toLowerCase() === user.email.toLowerCase()
        if (order.customer_id !== user.id && !emailMatches) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        let accountManager: { id: string; name: string | null; email: string | null; phone: string | null } | null = null

        if (order.reseller_id) {
            const { data: assignment } = await supabaseAdmin
                .from("account_manager_assignments")
                .select("account_manager_id")
                .eq("reseller_id", order.reseller_id)
                .is("soft_deleted_at", null)
                .maybeSingle()

            if (assignment?.account_manager_id) {
                const { data: manager } = await supabaseAdmin
                    .from("profiles")
                    .select("id, name, email, phone")
                    .eq("id", assignment.account_manager_id)
                    .maybeSingle()

                accountManager = manager || null
            }
        }

        return NextResponse.json({
            success: true,
            order: {
                ...order,
                account_manager: accountManager,
            },
        })
    } catch (error: any) {
        console.error("[Reseller Order API] Error:", error)
        return NextResponse.json({ error: error.message || "Failed to load order" }, { status: 500 })
    }
}
