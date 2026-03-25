import { NextRequest, NextResponse } from "next/server"

const MIDDLEWARE_URL = process.env.ERP_MIDDLEWARE_URL || "http://localhost:3002"

export async function GET(
  _request: NextRequest,
  { params }: { params: { trsId: string } }
) {
  try {
    const res = await fetch(`${MIDDLEWARE_URL}/commandes/status/${params.trsId}`, { cache: "no-store" })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Middleware unreachable" }, { status: 503 })
  }
}
