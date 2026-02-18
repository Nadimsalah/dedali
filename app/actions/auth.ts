"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// Server-side client for admin verification
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function verifyAdminPin(pin: string) {
    try {
        const { data, error } = await supabase
            .from("admin_settings")
            .select("value")
            .eq("key", "admin_pin")
            .single()

        if (error) {
            console.error("Error verifying admin PIN:", error)
            return false
        }

        return data?.value === pin
    } catch (error) {
        console.error("Unexpected error verifying admin PIN:", error)
        return false
    }
}
