import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DocumentCategoryService } from '@/domains/documents/category.service';
import { DocumentCategoryRepositoryPrisma } from '@/domains/documents/category.repository.prisma';
import { DocumentRepositoryPrisma } from '@/domains/documents/document.repository.prisma';
import { prisma } from '@/infrastructure/prisma/client';
import { CategoryNotFoundError } from '@/domains/documents/category.errors';

/**
 * @route DELETE /api/v1/documents/categories/[id]
 * @auth admin
 * @response 200 { success: true }
 * @description Удалить категорию документа с переносом документов
 *
 * @spec
 * - Авторизация: только ADMIN
 * - Переносит документы в родительскую категорию (или null)
 * - Перепривязывает подкатегории
 *
 * @traces US-22-02 AC-1..5
 * @task DOCS-T3.1.3
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Пожалуйста, авторизуйтесь' } },
        { status: 401 },
      );
    }

    if (!session.user.roles?.includes('ADMIN')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Недостаточно прав' } },
        { status: 403 },
      );
    }

    const { id } = params;

    const categoryRepo = new DocumentCategoryRepositoryPrisma(prisma);
    const documentRepo = new DocumentRepositoryPrisma(prisma);
    const categoryService = new DocumentCategoryService(categoryRepo, documentRepo);

    await categoryService.delete(id);

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof CategoryNotFoundError) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: err.message } },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
      { status: 500 },
    );
  }
}
