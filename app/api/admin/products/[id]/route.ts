import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params
        const authHeader = req.headers.get("authorization") || ""
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
        if (authError || !authData.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = authData.user.id
        const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .single()

        if (profileError || !profile || profile.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json()
        const {
            selectedRelated = [],
            ...productUpdates
        } = body

        const { error: productError } = await supabaseAdmin
            .from("products")
            .update({
                ...productUpdates,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)

        if (productError) {
            return NextResponse.json({ error: productError.message }, { status: 400 })
        }

        const { error: deleteError } = await supabaseAdmin
            .from("product_cross_sells")
            .delete()
            .eq("product_id", id)

        if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 400 })
        }

        if (Array.isArray(selectedRelated) && selectedRelated.length > 0) {
            const crossSells = selectedRelated.map((relatedProductId: string) => ({
                product_id: id,
                related_product_id: relatedProductId,
            }))

            const { error: insertError } = await supabaseAdmin
                .from("product_cross_sells")
                .insert(crossSells)

            if (insertError) {
                return NextResponse.json({ error: insertError.message }, { status: 400 })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("[Admin Products API] PATCH error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to update product" },
            { status: 500 }
        )
    }
}
