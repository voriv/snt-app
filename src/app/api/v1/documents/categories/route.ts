import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DocumentCategoryService } from '@/domains/documents/category.service';
import { DocumentCategoryRepositoryPrisma } from '@/domains/documents/category.repository.prisma';
import { DocumentRepositoryPrisma } from '@/domains/documents/document.repository.prisma';
import { prisma } from '@/infrastructure/prisma/client';
import { createCategorySchema } from '@/domains/documents/category.validators';
import { CategoryNameNotUniqueError, ParentCategoryNotFoundError } from '@/domains/documents/category.errors';

/**
 * @route GET /api/v1/documents/categories
 * @auth authenticated
 * @response 200 { success: true, data: CategoryTreeItem[] }
 * @description Получить дерево категорий документов
 *
 * @spec
 * - Авторизация: authenticated (любая роль)
 * - Возвращает дерево категорий для UI
 *
 * @traces US-22-01, US-22-05
 * @task DOCS-T3.1.2
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Пожалуйста, авторизуйтесь' } },
        { status: 401 },
      );
    }

    const categoryRepo = new DocumentCategoryRepositoryPrisma(prisma);
    const documentRepo = new DocumentRepositoryPrisma(prisma);
    const categoryService = new DocumentCategoryService(categoryRepo, documentRepo);

    const tree = await categoryService.getTree();

    return NextResponse.json({ success: true, data: tree });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
      { status: 500 },
    );
  }
}

/**
 * @route POST /api/v1/documents/categories
 * @auth admin
 * @body CreateCategoryData
 * @response 201 { success: true, data: DocumentCategory }
 * @description Создать новую категорию документа
 *
 * @spec
 * - Авторизация: только ADMIN
 * - Валидация через createCategorySchema
 * - Возвращает 201 с созданной категорией
 *
 * @traces US-22-01 AC-1..5
 * @task DOCS-T3.1.1
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Пожалуйста, авторизуйтесь' } },
        { status: 401 },
      );
    }

    // Проверка роли ADMIN
    if (!session.user.roles?.includes('ADMIN')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Недостаточно прав' } },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createCategorySchema.parse(body);

    const categoryRepo = new DocumentCategoryRepositoryPrisma(prisma);
    const documentRepo = new DocumentRepositoryPrisma(prisma);
    const categoryService = new DocumentCategoryService(categoryRepo, documentRepo);

    const category = await categoryService.create(parsed);

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (err) {
    if (err instanceof CategoryNameNotUniqueError) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: err.message } },
        { status: 409 },
      );
    }
    if (err instanceof ParentCategoryNotFoundError) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: err.message } },
        { status: 404 },
      );
    }
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Некорректный JSON' } },
        { status: 400 },
      );
    }
    // Zod validation error
    if (typeof err === 'object' && err !== null && 'issues' in err) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Ошибка валидации', details: (err as { issues: unknown }).issues },
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
      { status: 500 },
    );
  }
}
