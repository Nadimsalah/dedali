import { NextResponse } from "next/server"

const MIDDLEWARE_URL = process.env.ERP_MIDDLEWARE_URL || "http://localhost:3002"

export async function GET() {
  try {
    const res = await fetch(`${MIDDLEWARE_URL}/health`, { cache: "no-store" })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ status: "error", message: "Middleware unreachable" }, { status: 503 })
  }
}
