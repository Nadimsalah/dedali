import { NextRequest, NextResponse } from "next/server"

const MIDDLEWARE_URL = process.env.ERP_MIDDLEWARE_URL || "http://localhost:3002"

export async function GET(
  _request: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const ref = encodeURIComponent(params.reference)
    const res = await fetch(`${MIDDLEWARE_URL}/stock/${ref}`, { cache: "no-store" })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Middleware unreachable" }, { status: 503 })
  }
}
