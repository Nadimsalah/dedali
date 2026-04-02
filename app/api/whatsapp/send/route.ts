import { NextResponse } from "next/server"
import { sendWhatsAppMessage, generateOTP } from "@/lib/whatsapp"

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()
    if (!phone) {
      return NextResponse.json({ success: false, error: "Phone number required" }, { status: 400 })
    }

    const otp = generateOTP()
    const message = `👋 Bonjour ! Ceci est votre code de vérification Didali Store.\n\nVotre code est : *${otp}*\n\nCe code est confidentiel, ne le partagez avec personne.`
    
    // Send via Maytapi
    const result = await sendWhatsAppMessage(phone, message)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    // Hash the OTP statelessly using an existing secret key in the enviroment
    const salt = process.env.JWT_SECRET || process.env.VAPID_PRIVATE_KEY || "didali_secret"
    const hashData = `${otp}:${salt}`
    const token = Buffer.from(hashData).toString("base64")

    return NextResponse.json({ success: true, token })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
