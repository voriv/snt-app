import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: true, data: 'API v1 is running' });
}
