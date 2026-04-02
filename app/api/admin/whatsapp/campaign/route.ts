import { NextResponse } from "next/server"
import { sendWhatsAppMessage, sendWhatsAppMedia } from "@/lib/whatsapp"

export async function POST(req: Request) {
    try {
        const { to, message, mediaUrl, fileName } = await req.json()

        if (!to) {
            return NextResponse.json({ error: "Recipient is required" }, { status: 400 })
        }

        console.log(`[Campaign] Sending to ${to}...`)

        let result;
        if (mediaUrl) {
            // Maytapi uses "media" type for all media types including PDFs
            let type = "media";
            
            result = await sendWhatsAppMedia(to, mediaUrl, fileName || "file", message, type);
        } else {
            result = await sendWhatsAppMessage(to, message);
        }

        if (result.success) {
            return NextResponse.json({ success: true, data: result.data })
        } else {
            console.error(`[Campaign] Failed for ${to}:`, result.error)
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

    } catch (error: any) {
        console.error("[Campaign API] CRITICAL:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
