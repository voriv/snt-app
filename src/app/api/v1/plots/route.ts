import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Реализовать список участков
  return NextResponse.json({ success: true, data: [] });
}

export async function POST(request: Request) {
  // TODO: Реализовать создание участка
  return NextResponse.json({ success: true, data: {} }, { status: 201 });
}
