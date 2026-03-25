import { NextRequest, NextResponse } from "next/server"

const MIDDLEWARE_URL = process.env.ERP_MIDDLEWARE_URL || "http://localhost:3002"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.toString()
    const res = await fetch(`${MIDDLEWARE_URL}/articles${query ? `?${query}` : ""}`, { cache: "no-store" })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Middleware unreachable" }, { status: 503 })
  }
}
