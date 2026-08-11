import { NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/prisma/client';

/**
 * Health-маршрут для healthcheck в Docker Compose prod (B-034-T1).
 *
 * Возвращает HTTP 200 всегда (даже при недоступности БД) — healthcheck в compose
 * проверяет только HTTP-статус. При недоступности БД тело содержит `db: "error"`.
 */
export async function GET() {
  let dbStatus: 'ok' | 'error' = 'ok';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }

  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: dbStatus,
    },
    { status: 200 },
  );
}
