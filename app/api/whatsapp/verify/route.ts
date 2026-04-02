import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { otp, token } = await req.json()
    if (!otp || !token) {
      return NextResponse.json({ success: false, error: "OTP and Token required" }, { status: 400 })
    }

    const salt = process.env.JWT_SECRET || process.env.VAPID_PRIVATE_KEY || "didali_secret"
    const expectedToken = Buffer.from(`${otp}:${salt}`).toString("base64")

    if (token === expectedToken) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: "Code invalide" }, { status: 400 })
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
