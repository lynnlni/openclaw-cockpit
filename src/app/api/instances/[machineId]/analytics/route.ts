import { NextResponse } from 'next/server'

export async function GET(): Promise<Response> {
  return NextResponse.json({ success: false, error: 'SSH remote access is temporarily disabled' }, { status: 503 })
}
