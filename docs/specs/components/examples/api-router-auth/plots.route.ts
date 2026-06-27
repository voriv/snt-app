import { NextRequest } from 'next/server';
import { requireAuth } from './auth.utils';
import { successResponse, handleServiceError } from './response.utils';
import { PlotService } from '@/services/plot-service';
import { PrismaPlotRepository } from '@/repositories/plot-repository';
import { createPlotSchema, plotListQuerySchema, plotIdSchema, updatePlotSchema } from '@/validators/plot-schemas';

/**
 * GET /api/plots — получить список участков.
 *
 * @remarks
 * Требует авторизации. Поддерживает пагинацию и поиск.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const query = plotListQuerySchema.parse(Object.fromEntries(searchParams));

    const repository = new PrismaPlotRepository();
    const service = new PlotService(repository);
    const result = await service.list(query);

    return successResponse(result);
  } catch (error) {
    return handleServiceError(error);
  }
}

/**
 * POST /api/plots — создать новый участок.
 *
 * @remarks
 * Требует авторизации. Валидирует тело запроса через Zod.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult.response;

  try {
    const body = await request.json();
    const input = createPlotSchema.parse(body);

    const repository = new PrismaPlotRepository();
    const service = new PlotService(repository);
    const plot = await service.create(input);

    return successResponse(plot, 201);
  } catch (error) {
    return handleServiceError(error);
  }
}

/**
 * PUT /api/plots/:id — обновить участок.
 *
 * @remarks
 * Требует авторизации. Валидирует тело запроса и ID.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult.response;

  try {
    const { id } = plotIdSchema.parse(await params);
    const body = await request.json();
    const input = updatePlotSchema.parse(body);

    const repository = new PrismaPlotRepository();
    const service = new PlotService(repository);
    const plot = await service.update(id, input);

    return successResponse(plot);
  } catch (error) {
    return handleServiceError(error);
  }
}

/**
 * DELETE /api/plots/:id — удалить участок.
 *
 * @remarks
 * Требует авторизации. Возвращает 204 No Content при успехе.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult.response;

  try {
    const { id } = plotIdSchema.parse(await params);

    const repository = new PrismaPlotRepository();
    const service = new PlotService(repository);
    await service.delete(id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleServiceError(error);
  }
}