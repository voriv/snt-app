import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DocumentService } from '@/domains/documents/document.service';
import { DocumentRepositoryPrisma } from '@/domains/documents/document.repository.prisma';
import { DocumentTagRepositoryPrisma } from '@/domains/documents/tag.repository.prisma';
import { DocumentCategoryRepositoryPrisma } from '@/domains/documents/category.repository.prisma';
import { FileStorage } from '@/domains/documents/file.storage';
import { prisma } from '@/infrastructure/prisma/client';
import { documentFiltersSchema } from '@/domains/documents/document.validators';

/**
 * @route GET /api/v1/documents
 * @auth authenticated
 * @query DocumentFilter (categoryId, documentType, status, search, page, limit)
 * @response 200 { success: true, data: PaginatedResult<DocumentWithDetails> }
 * @description Получить список документов с фильтрацией и пагинацией
 *
 * @spec
 * - Извлечение query params → documentFiltersSchema
 * - auth() → получение userRole
 * - documentService.getDocuments(filters, userRole)
 * - ADMIN видит все (включая draft), остальные — только published + доступные по роли
 *
 * @traces US-22-05 AC-1..9
 * @task DOCS-T3.2.1
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Пожалуйста, авторизуйтесь' } },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const rawFilters: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      rawFilters[key] = value;
    });

    const parsed = documentFiltersSchema.parse(rawFilters);

    // Определяем роль пользователя
    const userRoles = session.user.roles ?? [];
    // Берём первую роль (в системе RBAC у пользователя может быть несколько ролей)
    const userRole = userRoles.includes('ADMIN') ? 'ADMIN' : (userRoles[0] ?? 'USER');

    const documentRepo = new DocumentRepositoryPrisma(prisma);
    const tagRepo = new DocumentTagRepositoryPrisma(prisma);
    const categoryRepo = new DocumentCategoryRepositoryPrisma(prisma);
    const fileStorage = new FileStorage();
    const documentService = new DocumentService(documentRepo, tagRepo, categoryRepo, fileStorage);

    const result = await documentService.getDocuments(parsed, userRole);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'issues' in err) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Ошибка валидации параметров', details: (err as { issues: unknown }).issues },
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
