/**
 * @file plots/search/route.ts
 * @description Route handler для поиска земельных участков по фильтрам
 *
 * @see docs/user-stories/US-17-plot-search.md — API для поиска участков
 */
import { NextRequest, NextResponse } from 'next/server';
import { createPlotService } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';

const plotService = createPlotService();

/**
 * @route GET /api/v1/plots/search
 * @auth required
 * @role ADMIN, MANAGER
 * @description Ищет земельные участки по фильтрам
 *
 * @query number - Номер участка (частичное совпадение)
 * @query cadstral - Кадастровый номер (частичное совпадение)
 * @query note - Поиск по описанию (частичное совпадение)
 *
 * @response 200 { success: true, data: Plot[] }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Все фильтры опциональны и комбинируются через AND
 * - Если все фильтры пустые — возвращается пустой массив
 * - Результаты отсортированы по plotNumber ASC
 */
async function handleGet(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const number = searchParams.get('number');
    const cadstral = searchParams.get('cadstral');
    const note = searchParams.get('note');

    const filters: Record<string, string> = {};
    if (number && number.trim()) filters.number = number.trim();
    if (cadstral && cadstral.trim()) filters.cadstral = cadstral.trim();
    if (note && note.trim()) filters.note = note.trim();

    const plots = await plotService.search(filters);
    return NextResponse.json({
      success: true,
      data: plots,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/plots/search' });

/**
 * Стандартизированная обработка ошибок
 */
function errorResponse(error: unknown): NextResponse {
  if (error instanceof Error && 'code' in error) {
    const baseError = error as BaseError;
    return NextResponse.json(
      { success: false, error: { code: baseError.code, message: baseError.message } },
      { status: baseError.statusCode },
    );
  }
  return NextResponse.json(
    { success: false, error: { code: 'UNKNOWN_ERROR', message: (error as Error).message || 'Unknown error' } },
    { status: 500 },
  );
}
